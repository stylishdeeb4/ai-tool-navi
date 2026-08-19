#!/usr/bin/env node
// =============================================================
// AIツールナビ アフィリエイト提携アウトリーチ CLI
// -------------------------------------------------------------
// 未提携のアフィリエイトプログラム（lib/affiliates.ts で url が空のもの）へ
// 提携を打診するまでの流れを、「人間の承認」を必ず挟む形で管理します。
//
//   下書き → 承認依頼 → 承認 → 書き出し → 送信記録 → 返信記録 → 提携成立
//
// 重要な設計方針:
//   1. このCLIはメールを送信しません。承認済みの文面を outreach/outbox/ に
//      書き出すところまでを行い、実際の送信は人間が行います。
//   2. 承認は「そのとき承認した文面（本文のSHA-256）」に紐づきます。
//      承認後に下書きを編集すると、承認は自動的に失効します。
//   3. 数値実績（PV等）や連絡先はリポジトリから取得できないため、
//      勝手に埋めず【要記入】として残します。空欄が残った下書きは承認できません。
//
// 使い方:  node scripts/outreach-cli.mjs help
// =============================================================

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { sendMail, isValidEmail } from './lib/smtp.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUTREACH_DIR = path.join(ROOT, 'outreach')
const PROSPECTS_FILE = path.join(OUTREACH_DIR, 'prospects.json')
const STATE_FILE = path.join(OUTREACH_DIR, 'state.json')
const AUDIT_FILE = path.join(OUTREACH_DIR, 'audit.log.jsonl')
const DRAFTS_DIR = path.join(OUTREACH_DIR, 'drafts')
const OUTBOX_DIR = path.join(OUTREACH_DIR, 'outbox')
const POSTS_DIR = path.join(ROOT, 'content/posts')

// ステータス定義（表示名つき）
const STATUS = {
  draft:     { label: '下書き',   hint: '編集中。承認依頼はまだ出ていません' },
  pending:   { label: '承認待ち', hint: '人間のレビュー待ち。送信はできません' },
  approved:  { label: '承認済み', hint: '書き出し・送信が可能です' },
  sent:      { label: '送信済み', hint: '返信待ち' },
  replied:   { label: '返信あり', hint: '結果を記録済み' },
  partnered: { label: '提携成立', hint: 'lib/affiliates.ts にリンクを反映してください' },
}
const PLACEHOLDER_RE = /【要記入[^】]*】/g

// ---------------------------------------------------------------
// 小さなユーティリティ
// ---------------------------------------------------------------

const ESC = String.fromCharCode(27)
const useColor = process.stdout.isTTY && !process.env.NO_COLOR
const c = (code, s) => (useColor ? `${ESC}[${code}m${s}${ESC}[0m` : String(s))
const bold = s => c('1', s)
const dim = s => c('2', s)
const green = s => c('32', s)
const yellow = s => c('33', s)
const red = s => c('31', s)
const cyan = s => c('36', s)

const nowIso = () => new Date().toISOString()

/** 日本語（全角）を2幅として数える表示幅 */
function dispWidth(s) {
  let w = 0
  for (const ch of String(s)) {
    const p = ch.codePointAt(0)
    const wide =
      (p >= 0x1100 && p <= 0x115f) ||
      (p >= 0x2e80 && p <= 0xa4cf && p !== 0x303f) ||
      (p >= 0xac00 && p <= 0xd7a3) ||
      (p >= 0xf900 && p <= 0xfaff) ||
      (p >= 0xfe30 && p <= 0xfe6f) ||
      (p >= 0xff00 && p <= 0xff60) ||
      (p >= 0xffe0 && p <= 0xffe6)
    w += wide ? 2 : 1
  }
  return w
}

const pad = (s, width) => String(s) + ' '.repeat(Math.max(0, width - dispWidth(s)))

/** 表示幅で切り詰める（表の桁ずれを防ぐ） */
function truncate(s, width) {
  const str = String(s)
  if (dispWidth(str) <= width) return str
  let out = ''
  for (const ch of str) {
    if (dispWidth(out + ch) > width - 1) break
    out += ch
  }
  return out + '…'
}

function fail(msg, extra) {
  console.error(`${red('NG')} ${msg}`)
  if (extra) console.error(extra)
  process.exit(1)
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    fail(`${path.relative(ROOT, file)} を読み込めませんでした: ${e.message}`)
  }
}

/** 一時ファイルに書いてから rename する（書き込み途中で落ちても壊れない） */
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.tmp${process.pid}`
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8')
  fs.renameSync(tmp, file)
}

/**
 * 排他ロック。
 * 状態ファイルは読み込み → 書き戻しで丸ごと上書きするため、
 * 同時に2つ実行されると「送信済み」の記録が消え、同じ相手に二重送信されうる。
 * そのため全コマンドを直列化する。
 */
function acquireLock({ timeoutMs = 15000, staleMs = 120000 } = {}) {
  const lockPath = path.join(OUTREACH_DIR, '.lock')
  fs.mkdirSync(OUTREACH_DIR, { recursive: true })
  const start = Date.now()
  for (;;) {
    try {
      const fd = fs.openSync(lockPath, 'wx')
      fs.writeSync(fd, JSON.stringify({ pid: process.pid, at: nowIso() }))
      fs.closeSync(fd)
      let released = false
      const release = () => {
        if (released) return
        released = true
        try { fs.unlinkSync(lockPath) } catch { /* 既に消えていれば何もしない */ }
      }
      // fail() は process.exit するため、finally ではなく exit で確実に外す
      process.on('exit', release)
      return release
    } catch (err) {
      if (err.code !== 'EEXIST') throw err
      // 放置された古いロックは壊す
      try {
        if (Date.now() - fs.statSync(lockPath).mtimeMs > staleMs) {
          fs.unlinkSync(lockPath)
          continue
        }
      } catch { /* competing プロセスが先に消した */ }
      if (Date.now() - start > timeoutMs) {
        fail('他のプロセスが outreach の状態を更新中です。終わるのを待って再実行してください。',
          `  ロックファイル: ${path.relative(ROOT, lockPath)}\n  不要なら削除してください。`)
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100)
    }
  }
}

const sha256 = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex')

/** --flag value / --flag=value / --flag(真偽) をパースする */
function parseArgs(argv) {
  const args = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) { args._.push(a); continue }
    const eq = a.indexOf('=')
    if (eq !== -1) { args[a.slice(2, eq)] = a.slice(eq + 1); continue }
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) args[a.slice(2)] = true
    else { args[a.slice(2)] = next; i++ }
  }
  return args
}

// ---------------------------------------------------------------
// リポジトリから「事実」を集める
//   ブリーフや下書きに書く材料は、できる限りリポジトリの実データから取る。
//   （取れない数値は捏造せず【要記入】として残す）
// ---------------------------------------------------------------

/** app/layout.tsx からサイト名・URLを読む（単一情報源をずらさないため） */
function readSiteConfig() {
  const fallback = { name: 'AIツールナビ', url: 'https://hukugyou.blog' }
  try {
    const src = fs.readFileSync(path.join(ROOT, 'app/layout.tsx'), 'utf8')
    const name = src.match(/const SITE_NAME\s*=\s*'([^']+)'/)
    const url = src.match(/NEXT_PUBLIC_SITE_URL\s*\|\|\s*'([^']+)'/)
    return {
      name: name ? name[1] : fallback.name,
      url: url ? url[1] : fallback.url,
    }
  } catch {
    return fallback
  }
}

/** lib/affiliates.ts をパースして key ごとの名称・リンク有無を得る */
function readAffiliates() {
  const file = path.join(ROOT, 'lib/affiliates.ts')
  if (!fs.existsSync(file)) return {}
  const src = fs.readFileSync(file, 'utf8')
  const start = src.indexOf('export const affiliates')
  if (start === -1) return {}
  const body = src.slice(start)
  const entry = /^ {2}([a-zA-Z0-9_]+):\s*\{([\s\S]*?)^ {2}\},/gm
  const out = {}
  let m
  while ((m = entry.exec(body)) !== null) {
    const [, key, block] = m
    const name = block.match(/name:\s*'([^']*)'/)
    const eyebrow = block.match(/eyebrow:\s*'([^']*)'/)
    const url = block.match(/url:\s*'([^']*)'/)
    out[key] = {
      key,
      name: name ? name[1] : key,
      eyebrow: eyebrow ? eyebrow[1] : '',
      url: url ? url[1] : '',
      linked: Boolean(url && url[1]),
    }
  }
  return out
}

/** content/posts を走査し、{{AFF:key}} の掲載枠がどの記事にあるかを集める */
function readPlacements() {
  const byKey = {}
  if (!fs.existsSync(POSTS_DIR)) return byKey
  for (const file of fs.readdirSync(POSTS_DIR).filter(f => /\.mdx?$/.test(f))) {
    const slug = file.replace(/\.mdx?$/, '')
    const src = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8')
    const title = (src.match(/^title:\s*"([^"]*)"/m) || [])[1] || slug
    const category = (src.match(/^category:\s*"([^"]*)"/m) || [])[1] || ''
    for (const m of src.matchAll(/\{\{AFF:([a-zA-Z0-9_]+)\}\}/g)) {
      const key = m[1]
      byKey[key] = byKey[key] || []
      if (!byKey[key].some(p => p.slug === slug)) byKey[key].push({ slug, title, category })
    }
  }
  return byKey
}

/** サイト全体の、相手に提示できる事実 */
function readSiteFacts() {
  const posts = fs.existsSync(POSTS_DIR)
    ? fs.readdirSync(POSTS_DIR).filter(f => /\.mdx?$/.test(f))
    : []
  const categories = new Set()
  for (const f of posts) {
    const src = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8')
    const cat = (src.match(/^category:\s*"([^"]*)"/m) || [])[1]
    if (cat) categories.add(cat)
  }
  const affiliates = readAffiliates()
  const partnered = Object.values(affiliates).filter(a => a.linked).map(a => a.name)
  return {
    site: readSiteConfig(),
    postCount: posts.length,
    categories: [...categories],
    partnered,
    hasAbout: fs.existsSync(path.join(ROOT, 'app/about/page.tsx')),
    hasPrivacy: fs.existsSync(path.join(ROOT, 'app/privacy-policy/page.tsx')),
    hasContact: fs.existsSync(path.join(ROOT, 'app/contact/page.tsx')),
    hasAdsTxt: fs.existsSync(path.join(ROOT, 'public/ads.txt')),
    autoPublish: fs.existsSync(path.join(ROOT, '.github/workflows/daily-article.yml')),
    sponsoredRel: fs.existsSync(path.join(ROOT, 'lib/affiliates.ts')) &&
      fs.readFileSync(path.join(ROOT, 'lib/affiliates.ts'), 'utf8').includes('rel="sponsored nofollow noopener"'),
  }
}

// ---------------------------------------------------------------
// 台帳（prospects）・状態（state）・監査ログ
// ---------------------------------------------------------------

function loadProspects() {
  const data = readJson(PROSPECTS_FILE, null)
  if (!data) fail(`${path.relative(ROOT, PROSPECTS_FILE)} が見つかりません。`)
  const list = Array.isArray(data) ? data : data.prospects
  if (!Array.isArray(list)) fail('prospects.json の形式が不正です（prospects 配列が必要）。')
  return list
}

function findProspect(id) {
  if (!id || id === true) {
    fail('プロスペクトIDを指定してください（例: --prospect-id P002）。一覧は list コマンドで確認できます。')
  }
  const wanted = String(id).toUpperCase()
  const p = loadProspects().find(x => x.id.toUpperCase() === wanted)
  if (!p) {
    const ids = loadProspects().map(x => `${x.id} ${x.name}`).join('\n  ')
    fail(`プロスペクト ${id} は台帳にありません。`, `  登録済み:\n  ${ids}`)
  }
  return p
}

function loadState() {
  return readJson(STATE_FILE, { version: 1, updatedAt: null, prospects: {} })
}

function saveState(state) {
  state.updatedAt = nowIso()
  writeJson(STATE_FILE, state)
}

/** 状態エントリを取得（なければ初期値を作る） */
function entryOf(state, id) {
  if (!state.prospects[id]) {
    state.prospects[id] = { status: 'draft', history: [], notes: [] }
  }
  const e = state.prospects[id]
  e.history = e.history || []
  e.notes = e.notes || []
  return e
}

/** 追記のみの監査ログ */
function audit(record) {
  fs.mkdirSync(OUTREACH_DIR, { recursive: true })
  fs.appendFileSync(AUDIT_FILE, JSON.stringify({ at: nowIso(), ...record }) + '\n', 'utf8')
}

function transition(state, id, to, action, detail = {}) {
  const e = entryOf(state, id)
  const from = e.status
  e.status = to
  e.history.push({ at: nowIso(), action, from, to, ...detail })
  audit({ prospect: id, action, from, to, ...detail })
  return e
}

// ---------------------------------------------------------------
// 下書きファイルの取り扱い
//   下書きは「ヘッダ（--- 区切り）」＋「本文」で構成する。
//   承認のハッシュは “実際に送る文面 = 本文” に対して取る。
// ---------------------------------------------------------------

const draftPath = id => path.join(DRAFTS_DIR, `${id}.md`)
const outboxPath = id => path.join(OUTBOX_DIR, `${id}.txt`)

function readDraft(id) {
  const file = draftPath(id)
  if (!fs.existsSync(file)) return null
  const raw = fs.readFileSync(file, 'utf8')
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  const body = m ? m[2] : raw
  return { file, raw, body, hash: sha256(body.trim()) }
}

/** 未記入の【要記入：…】を洗い出す */
function findPlaceholders(body) {
  return [...new Set(body.match(PLACEHOLDER_RE) || [])]
}

/**
 * 承認の整合性チェック。
 * 承認待ち／承認済みなのに下書きが編集されていたら、その承認は失効させる。
 * （読み取り系コマンドでも実行する。失効は「起きた事実」なので記録に残す）
 */
function syncIntegrity(state) {
  const voided = []
  for (const [id, e] of Object.entries(state.prospects || {})) {
    if (!['pending', 'approved'].includes(e.status)) continue
    const d = readDraft(id)
    if (!d) {
      voided.push({ id, reason: '下書きファイルが見つかりません' })
      transition(state, id, 'draft', 'approval_invalidated', { reason: 'draft_missing' })
      delete e.approvedHash; delete e.approvedBy; delete e.approvedAt
      continue
    }
    if (e.draftHash && d.hash !== e.draftHash) {
      voided.push({ id, reason: '承認後に下書きが編集されました' })
      transition(state, id, 'draft', 'approval_invalidated', {
        reason: 'draft_modified', expected: e.draftHash.slice(0, 12), actual: d.hash.slice(0, 12),
      })
      delete e.approvedHash; delete e.approvedBy; delete e.approvedAt; delete e.approvedRecipient
      continue
    }
    // 宛先の書き換えも承認の失効事由にする
    const prospect = loadProspects().find(x => x.id === id)
    const current = prospect ? recipientOf(prospect) : ''
    // 束縛が記録されていない承認は「無効」に倒す。
    // undefined を素通りさせると、宛先の束縛が丸ごと効かなくなる。
    const bound = (e.status === 'approved' ? e.approvedRecipient : e.recipient) ?? null
    if (current !== (bound ?? '')) {
      voided.push({
        id,
        reason: bound === null
          ? '宛先の記録がない承認のため無効化しました（再承認が必要です）'
          : `承認後に宛先が変更されました（${bound || '未設定'} → ${current || '未設定'}）`,
      })
      transition(state, id, 'draft', 'approval_invalidated', {
        reason: 'recipient_changed', expected: bound || null, actual: current || null,
      })
      delete e.approvedHash; delete e.approvedBy; delete e.approvedAt; delete e.approvedRecipient
    }
  }
  // 監査ログは検知時点で書かれるので、状態も同じタイミングで保存する。
  // （保存しないと、次のコマンドが同じ失効を再検知してログが二重になる）
  if (voided.length) saveState(state)
  return voided
}

/** 直前の syncIntegrity でこのプロスペクトの承認が失効していたら警告する */
function warnIfVoided(voided, id) {
  const v = voided.find(x => x.id === id)
  if (v) console.error(`${yellow('!')} ${id} の承認は失効しています（${v.reason}）。submit → approve をやり直してください。`)
  return Boolean(v)
}

// ---------------------------------------------------------------
// 下書き文面の生成
// ---------------------------------------------------------------

function buildDraftBody(prospect, ctx) {
  const { facts, places } = ctx
  const site = facts.site
  const addressee = prospect.company ? `${prospect.company}\nアフィリエイトプログラム ご担当者様` : `${prospect.name} ご担当者様`
  const placement = places.length
    ? places.map(p => `・「${p.title}」\n　 ${site.url}/blog/${p.slug}`).join('\n')
    : '・【要記入：掲載予定の記事URLと、どの位置で紹介するかを記載してください】'
  const asks = (prospect.asks && prospect.asks.length ? prospect.asks : ['提携審査のご承認'])
    .map(a => `・${a}`).join('\n')

  return `## 件名
【提携のご相談】AIツール・副業メディア「${site.name}」より

## 本文
${addressee}

はじめまして。
AIツール・AI副業の情報メディア「${site.name}」（${site.url}）を運営しております、【要記入：運営者名】と申します。

このたび、${prospect.name}様のアフィリエイトプログラムとの提携を希望し、ご連絡いたしました。

■ 当メディアについて
・サイト名：${site.name}（${site.url}）
・テーマ：ChatGPT・Claude などAIツールの使い方／比較、AIを活用した副業・収益化
・公開記事数：${facts.postCount}本（${facts.categories.join('／')}）
・運営形態：個人運営${facts.autoPublish ? '（記事は継続的に追加・リライトしています）' : ''}
・月間PV：【要記入：直近1か月の実数】
・主な読者層：【要記入：例）AIを使い始めた20〜40代／副業を検討中の会社員】
${facts.partnered.length ? `・提携実績：${facts.partnered.join('、')}` : ''}

■ 掲載イメージ
${prospect.name}様をご紹介する枠を以下の記事に用意しており、提携をご承認いただければすぐに掲載できる状態です。
${placement}

■ 当メディアの運用方針
・料金や機能は公式サイトの一次情報を確認したうえで記載します
・アフィリエイトリンクには rel="sponsored nofollow" を付与し、広告であることを明示します
・広告・PRを含む記事である旨を明記し、ステルスマーケティングにあたる表示は行いません
・運営者情報（${site.url}/about）とプライバシーポリシー（${site.url}/privacy-policy）を公開しています
・貴社のブランドガイドライン・掲載ルールに沿って記載を修正いたします

■ ご相談したいこと
${asks}

ご多用のところ恐れ入りますが、ご検討いただけますと幸いです。
何卒よろしくお願いいたします。

────────────────
${site.name}　【要記入：運営者名】
${site.url}
連絡先：【要記入：返信先メールアドレス】
────────────────
`
}

function writeDraft(prospect, ctx) {
  fs.mkdirSync(DRAFTS_DIR, { recursive: true })
  const body = buildDraftBody(prospect, ctx)
  const header = [
    '---',
    `prospect: ${prospect.id}`,
    `name: ${prospect.name}`,
    `channel: ${prospect.channel || 'unknown'}`,
    `generated: ${nowIso()}`,
    '# このヘッダは送信されません。承認は「## 件名」以降の本文に対して行われます。',
    prospect.channel === 'asp'
      ? `# 送付メモ: ${prospect.aspHint || 'ASP'} の提携申請フォームから送る場合は、件名を除いた本文のみを貼り付けてください。`
      : '# 送付メモ: 送付先（公式の問い合わせ窓口／アフィリエイト窓口）を確認してから送ってください。',
    '---',
    '',
  ].join('\n')
  fs.writeFileSync(draftPath(prospect.id), header + body, 'utf8')
  return readDraft(prospect.id)
}

// ---------------------------------------------------------------
// 表示ヘルパ
// ---------------------------------------------------------------

function statusLabel(status) {
  const s = STATUS[status]
  if (!s) return status
  const color = status === 'approved' || status === 'partnered' ? green
    : status === 'pending' ? yellow
    : status === 'sent' ? cyan
    : x => x
  return color(s.label)
}

function heading(title) {
  const line = '='.repeat(64)
  return `${bold(line)}\n ${bold(title)}\n${bold(line)}`
}

const section = t => `\n${bold('| ' + t)}`
const row = (k, v) => `  ${pad(k, 22)}${v}`

// ---------------------------------------------------------------
// コマンド: brief
//   その相手に連絡する前に見ておくべきことを1画面にまとめる。
// ---------------------------------------------------------------

function cmdBrief(args) {
  const prospect = findProspect(args['prospect-id'] || args.id || args._[1])
  const state = loadState()
  const voided = syncIntegrity(state)

  const facts = readSiteFacts()
  const affiliates = readAffiliates()
  const placements = readPlacements()
  const aff = affiliates[prospect.affiliateKey]
  const places = placements[prospect.affiliateKey] || []
  const e = state.prospects[prospect.id] || { status: 'draft', history: [], notes: [] }
  const draft = readDraft(prospect.id)
  const placeholders = draft ? findPlaceholders(draft.body) : []

  if (args.json) {
    console.log(JSON.stringify({
      prospect, status: e.status, statusLabel: STATUS[e.status]?.label,
      draft: draft ? { path: path.relative(ROOT, draft.file), hash: draft.hash, placeholders } : null,
      affiliate: aff || null, placements: places, siteFacts: facts,
      approval: { approvedBy: e.approvedBy || null, approvedAt: e.approvedAt || null },
      invalidated: voided.filter(v => v.id === prospect.id),
    }, null, 2))
    return
  }

  const out = []
  out.push(heading(`提携アウトリーチ ブリーフ  ${prospect.id} / ${prospect.name}`))

  if (voided.some(v => v.id === prospect.id)) {
    out.push(`\n${yellow('! 承認が失効しました')} — ${voided.find(v => v.id === prospect.id).reason}。再度 submit → approve が必要です。`)
  }

  out.push(section('1. 相手先'))
  out.push(row('プログラム名', prospect.name))
  out.push(row('運営会社', prospect.company || dim('要確認（公式サイトで確認して台帳に記入）')))
  out.push(row('公式サイト', prospect.site || dim('要確認')))
  out.push(row('カテゴリ', prospect.category))
  out.push(row('接触チャネル', prospect.channel === 'asp'
    ? `ASP経由（${prospect.aspHint || '要確認'}）`
    : prospect.channel === 'direct' ? '直接（問い合わせフォーム／メール）' : dim('要確認')))
  out.push(row('連絡先', prospect.contact?.url || dim(prospect.contact?.note || '要確認（公式サイトで確認）')))
  out.push(row('想定単価帯', { high: '高（スクール・サーバー等）', mid: '中', low: '低（無料登録型）' }[prospect.payoutTier] || '不明'))

  out.push(section('2. 現在のステータス'))
  out.push(row('ステータス', `${statusLabel(e.status)}　${dim(STATUS[e.status]?.hint || '')}`))
  out.push(row('下書き', draft ? path.relative(ROOT, draft.file) : dim('未作成')))
  if (draft) out.push(row('本文ハッシュ', dim(draft.hash.slice(0, 16))))
  out.push(row('承認', e.approvedAt ? `${green('承認済み')} ${e.approvedBy || ''} (${e.approvedAt})` : dim('未承認')))
  if (e.sentAt) out.push(row('送信', `${e.sentAt}${e.sentVia ? ` / ${e.sentVia}` : ''}`))
  if (e.outcome) out.push(row('結果', e.outcome))
  if (e.lastRejection) out.push(row('直近の差し戻し', yellow(`${e.lastRejection.reason}（${e.lastRejection.by}）`)))
  if (placeholders.length) out.push(row('未記入欄', yellow(`${placeholders.length}件 — ${placeholders.join(' ')}`)))

  out.push(section('3. なぜ今このプログラムか（掲載枠の実データ）'))
  if (aff) {
    out.push(row('アフィリキー', `${prospect.affiliateKey}${aff.linked ? green('（リンク設定済み）') : yellow('（未設定＝本番では非表示）')}`))
  } else {
    out.push(row('アフィリキー', yellow(`${prospect.affiliateKey} は lib/affiliates.ts に未登録`)))
  }
  out.push(row('掲載待ちの枠', places.length ? `${places.length}件` : dim('0件（新規に掲載枠を作る必要あり）')))
  for (const p of places) out.push(`    - ${p.title}\n      ${dim(`content/posts/${p.slug}.mdx`)}`)
  if (places.length && aff && !aff.linked) {
    out.push(`  ${dim(`※ url が空のため、上記${places.length}件のCTAは本番で非表示。提携完了と同時に反映されます。`)}`)
  }

  out.push(section('4. こちらから提示できる材料（リポジトリで確認できる事実）'))
  out.push(row('公開記事数', `${facts.postCount}本`))
  out.push(row('カテゴリ', facts.categories.join(' / ')))
  out.push(row('既存の提携実績', facts.partnered.length ? facts.partnered.join('、') : dim('なし')))
  out.push(row('運営者情報', facts.hasAbout ? green('公開済み /about') : red('未公開')))
  out.push(row('プライバシーポリシー', facts.hasPrivacy ? green('公開済み /privacy-policy') : red('未公開')))
  out.push(row('問い合わせ窓口', facts.hasContact ? green('公開済み /contact') : red('未公開')))
  out.push(row('広告表記', facts.sponsoredRel ? green('rel="sponsored nofollow noopener" を全CTAに付与') : yellow('要確認')))
  out.push(row('更新体制', facts.autoPublish ? '記事自動生成ワークフローあり' : dim('手動更新')))
  out.push(`  ${dim('※ PV・UU・収益はリポジトリからは取得できません。下書きの【要記入】欄に実数を記入してください（推測値は書かない）。')}`)

  out.push(section('5. 依頼内容（下書きの骨子）'))
  for (const a of (prospect.asks || [])) out.push(`    - ${a}`)
  if (prospect.fit) out.push(`\n  ${dim('提携したい理由: ' + prospect.fit)}`)
  if (prospect.notes) out.push(`  ${dim('メモ: ' + prospect.notes)}`)

  out.push(section('6. 送付前チェック'))
  const check = (ok, label) => `    ${ok === true ? green('[x]') : ok === false ? red('[ ]') : '[ ]'} ${label}`
  out.push(check(Boolean(prospect.company && prospect.site), '会社名・公式サイトの正式表記を確認した'))
  out.push(check(Boolean(prospect.contact?.url || prospect.contact?.note), '送付先（ASPプログラム／問い合わせ窓口）を確認した'))
  out.push(check(draft ? placeholders.length === 0 : false, '下書きの【要記入】をすべて埋めた（PV・運営者名・返信先）'))
  out.push(check(e.status === 'approved', '人間の承認を得た（承認なしでは export できません）'))
  out.push(check(null, '同じ相手に重複して送っていないか log で確認した'))

  out.push(section('7. 次に実行するコマンド'))
  const next = !draft ? `node scripts/outreach-cli.mjs draft --prospect-id ${prospect.id}`
    : placeholders.length ? `# まず下書きの【要記入】を埋める: ${path.relative(ROOT, draft.file)}`
    : e.status === 'draft' ? `node scripts/outreach-cli.mjs submit --prospect-id ${prospect.id}`
    : e.status === 'pending' ? `node scripts/outreach-cli.mjs approve --prospect-id ${prospect.id} --by "あなたの名前"`
    : e.status === 'approved' ? `node scripts/outreach-cli.mjs export --prospect-id ${prospect.id}`
    : e.status === 'sent' ? `node scripts/outreach-cli.mjs mark-replied --prospect-id ${prospect.id} --outcome accepted`
    : `node scripts/outreach-cli.mjs status`
  out.push(`  ${cyan(next)}`)
  out.push('')

  console.log(out.join('\n'))
}

// ---------------------------------------------------------------
// コマンド: list / status
// ---------------------------------------------------------------

function cmdList(args) {
  const state = loadState()
  const voided = syncIntegrity(state)

  const affiliates = readAffiliates()
  const placements = readPlacements()
  let rows = loadProspects().map(p => {
    const e = state.prospects[p.id] || { status: 'draft' }
    const aff = affiliates[p.affiliateKey]
    return {
      id: p.id, name: p.name, category: p.category, status: e.status,
      slots: (placements[p.affiliateKey] || []).length,
      linked: Boolean(aff && aff.linked),
      priority: priorityScore(p, placements),
    }
  })
  if (args.status) rows = rows.filter(r => r.status === args.status)
  if (args.category) rows = rows.filter(r => r.category.includes(args.category))
  rows.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))

  if (args.json) return void console.log(JSON.stringify(rows, null, 2))

  console.log(heading('提携アウトリーチ 台帳'))
  console.log(`  ${pad('ID', 6)}${pad('プログラム', 30)}${pad('ステータス', 12)}${pad('掲載枠', 8)}${pad('優先度', 8)}リンク`)
  console.log(`  ${'-'.repeat(72)}`)
  for (const r of rows) {
    console.log(`  ${pad(r.id, 6)}${pad(truncate(r.name, 30), 30)}${pad(STATUS[r.status]?.label || r.status, 12)}${pad(`${r.slots}件`, 8)}${pad(String(r.priority), 8)}${r.linked ? green('設定済') : dim('未設定')}`)
  }
  console.log(`\n  ${dim('優先度 = 掲載待ちの枠数 × 単価帯の重み。ブリーフは brief --prospect-id <ID> で表示します。')}`)
}

/** 掲載枠の数と単価帯から優先度を算出（データから決まるので手で並べ替えない） */
function priorityScore(prospect, placements) {
  const slots = (placements[prospect.affiliateKey] || []).length
  const weight = { high: 3, mid: 2, low: 1 }[prospect.payoutTier] || 1
  return slots * weight + (prospect.payoutTier === 'high' ? 2 : 0)
}

function cmdStatus(args) {
  const state = loadState()
  const voided = syncIntegrity(state)
  const prospects = loadProspects()
  const counts = {}
  for (const p of prospects) {
    const s = (state.prospects[p.id] || { status: 'draft' }).status
    counts[s] = (counts[s] || 0) + 1
  }
  if (args.json) return void console.log(JSON.stringify({ total: prospects.length, counts }, null, 2))

  console.log(heading('提携アウトリーチ パイプライン'))
  for (const [key, meta] of Object.entries(STATUS)) {
    const n = counts[key] || 0
    console.log(row(meta.label, `${String(n).padStart(2)}件  ${dim(meta.hint)}`))
  }
  console.log(`\n  ${dim(`合計 ${prospects.length}件`)}`)
  const pending = Object.entries(state.prospects).filter(([, e]) => e.status === 'pending').map(([id]) => id)
  if (pending.length) console.log(`\n  ${yellow('承認待ち:')} ${pending.join(', ')}  → approve / reject を実行してください`)
  if (voided.length) console.log(`\n  ${yellow('承認失効:')} ${voided.map(v => `${v.id}（${v.reason}）`).join(', ')}`)
}

// ---------------------------------------------------------------
// コマンド: draft
// ---------------------------------------------------------------

function cmdDraft(args) {
  const prospect = findProspect(args['prospect-id'] || args.id || args._[1])
  const state = loadState()
  warnIfVoided(syncIntegrity(state), prospect.id)
  const e = entryOf(state, prospect.id)

  if (['pending', 'approved', 'sent', 'replied', 'partnered'].includes(e.status) && !args.force) {
    fail(`${prospect.id} は「${STATUS[e.status].label}」です。下書きを作り直すと承認は失効します。実行するなら --force を付けてください。`)
  }
  const existing = readDraft(prospect.id)
  if (existing && !args.force) {
    fail(`下書きは既にあります: ${path.relative(ROOT, existing.file)}\n  上書きするなら --force を付けてください（手で編集した内容は失われます）。`)
  }

  const ctx = { facts: readSiteFacts(), places: readPlacements()[prospect.affiliateKey] || [] }
  const d = writeDraft(prospect, ctx)
  e.draftHash = d.hash
  transition(state, prospect.id, 'draft', 'draft_generated', { hash: d.hash.slice(0, 12) })
  delete e.approvedHash; delete e.approvedBy; delete e.approvedAt
  saveState(state)

  const placeholders = findPlaceholders(d.body)
  console.log(`${green('OK')} 下書きを作成しました: ${path.relative(ROOT, d.file)}`)
  if (placeholders.length) {
    console.log(`\n${yellow('!')} 未記入の欄が ${placeholders.length}件あります。埋めるまで承認できません。`)
    for (const ph of placeholders) console.log(`    ${ph}`)
  }
  console.log(`\n次: 内容を確認・編集してから\n  ${cyan(`node scripts/outreach-cli.mjs submit --prospect-id ${prospect.id}`)}`)
}

// ---------------------------------------------------------------
// コマンド: submit / approve / reject  ← 承認ゲート本体
// ---------------------------------------------------------------

function cmdSubmit(args) {
  const prospect = findProspect(args['prospect-id'] || args.id || args._[1])
  const state = loadState()
  warnIfVoided(syncIntegrity(state), prospect.id)
  const e = entryOf(state, prospect.id)
  const d = readDraft(prospect.id)
  if (!d) fail(`下書きがありません。まず draft --prospect-id ${prospect.id} を実行してください。`)
  if (!['draft'].includes(e.status)) fail(`${prospect.id} は「${STATUS[e.status].label}」のため承認依頼を出せません。`)

  const placeholders = findPlaceholders(d.body)
  if (placeholders.length) {
    fail(`未記入の欄が ${placeholders.length}件あります。埋めてから再実行してください。`,
      placeholders.map(p => `    ${p}`).join('\n') + `\n  対象: ${path.relative(ROOT, d.file)}`)
  }
  e.draftHash = d.hash
  e.recipient = recipientOf(prospect)
  transition(state, prospect.id, 'pending', 'submitted', {
    hash: d.hash.slice(0, 12), by: args.by || null, recipient: e.recipient || null,
  })
  saveState(state)
  console.log(`${green('OK')} ${prospect.id} を承認待ちにしました（本文ハッシュ ${d.hash.slice(0, 12)}）。`)
  console.log(`\nレビュー: ${path.relative(ROOT, d.file)}`)
  console.log(`承認:     ${cyan(`node scripts/outreach-cli.mjs approve --prospect-id ${prospect.id} --by "あなたの名前"`)}`)
  console.log(`差し戻し: ${cyan(`node scripts/outreach-cli.mjs reject --prospect-id ${prospect.id} --by "あなたの名前" --reason "理由"`)}`)
}

function cmdApprove(args) {
  const prospect = findProspect(args['prospect-id'] || args.id || args._[1])
  const by = args.by
  if (!by || by === true) fail('承認者を指定してください（例: --by "田中"）。誰が承認したか残らない承認は無効です。')

  const state = loadState()
  warnIfVoided(syncIntegrity(state), prospect.id)
  const e = entryOf(state, prospect.id)
  if (e.status !== 'pending') {
    fail(`${prospect.id} は「${STATUS[e.status].label}」です。承認できるのは「承認待ち」のものだけです。` +
      (e.status === 'draft' ? `\n  先に submit --prospect-id ${prospect.id} を実行してください。` : ''))
  }
  const d = readDraft(prospect.id)
  if (!d) fail('下書きが見つかりません。')
  if (e.draftHash && d.hash !== e.draftHash) {
    fail('承認依頼後に下書きが変更されています。submit からやり直してください。')
  }
  const placeholders = findPlaceholders(d.body)
  if (placeholders.length) fail(`未記入の欄が残っています: ${placeholders.join(' ')}`)

  e.approvedHash = d.hash
  e.approvedBy = by
  e.approvedAt = nowIso()
  e.approvedRecipient = recipientOf(prospect)
  delete e.lastRejection
  transition(state, prospect.id, 'approved', 'approved', {
    by, hash: d.hash.slice(0, 12), recipient: e.approvedRecipient || null, note: args.note || null,
  })
  saveState(state)
  console.log(`${green('OK')} ${prospect.id} を承認しました（承認者: ${by}）。`)
  console.log(`  ${dim(`この承認は本文ハッシュ ${d.hash.slice(0, 12)} と宛先「${e.approvedRecipient || '未設定'}」に紐づきます。`)}`)
  console.log(`  ${dim('以後に文面または宛先を変更すると、承認は自動的に失効します。')}`)
  console.log(`\n次: ${cyan(`node scripts/outreach-cli.mjs export --prospect-id ${prospect.id}`)}`)
}

function cmdReject(args) {
  const prospect = findProspect(args['prospect-id'] || args.id || args._[1])
  const by = args.by
  const reason = args.reason
  if (!by || by === true) fail('差し戻した人を指定してください（例: --by "田中"）。')
  if (!reason || reason === true) fail('差し戻しの理由を指定してください（例: --reason "実績の数値が未記入"）。')

  const state = loadState()
  warnIfVoided(syncIntegrity(state), prospect.id)
  const e = entryOf(state, prospect.id)
  if (e.status !== 'pending') fail(`${prospect.id} は「${STATUS[e.status].label}」です。差し戻せるのは「承認待ち」のものだけです。`)

  e.lastRejection = { by, reason, at: nowIso() }
  delete e.approvedHash; delete e.approvedBy; delete e.approvedAt
  transition(state, prospect.id, 'draft', 'rejected', { by, reason })
  saveState(state)
  console.log(`${yellow('差し戻しました')} ${prospect.id}: ${reason}`)
  console.log(`  下書きを修正してから submit をやり直してください: ${path.relative(ROOT, draftPath(prospect.id))}`)
}

// ---------------------------------------------------------------
// コマンド: export / mark-sent / mark-replied / mark-partnered
//   export はメール送信ではなく「承認済み文面の書き出し」。送信は人間が行う。
// ---------------------------------------------------------------

function cmdExport(args) {
  const prospect = findProspect(args['prospect-id'] || args.id || args._[1])
  const state = loadState()
  warnIfVoided(syncIntegrity(state), prospect.id)
  const e = entryOf(state, prospect.id)
  if (e.status !== 'approved') {
    fail(`${prospect.id} は「${STATUS[e.status].label}」です。書き出せるのは承認済みの文面だけです。`,
      e.status === 'pending' ? '  承認者による approve が必要です。' : `  submit → approve を実行してください。`)
  }
  const d = readDraft(prospect.id)
  if (!d || d.hash !== e.approvedHash) fail('承認済みの文面と現在の下書きが一致しません。submit からやり直してください。')

  fs.mkdirSync(OUTBOX_DIR, { recursive: true })
  const text = d.body.trim() + '\n'
  fs.writeFileSync(outboxPath(prospect.id), text, 'utf8')
  e.exportedAt = nowIso()
  audit({ prospect: prospect.id, action: 'exported', by: e.approvedBy, hash: d.hash.slice(0, 12) })
  e.history.push({ at: e.exportedAt, action: 'exported', from: 'approved', to: 'approved' })
  saveState(state)

  console.log(`${green('OK')} 承認済みの文面を書き出しました: ${path.relative(ROOT, outboxPath(prospect.id))}`)
  console.log(`  ${dim('このCLIは送信を行いません。上記ファイルの内容をコピーして、あなた自身が送信してください。')}`)
  console.log(`\n送信したら: ${cyan(`node scripts/outreach-cli.mjs mark-sent --prospect-id ${prospect.id} --via "A8.net 提携申請"`)}`)
}

function cmdMarkSent(args) {
  const prospect = findProspect(args['prospect-id'] || args.id || args._[1])
  const state = loadState()
  warnIfVoided(syncIntegrity(state), prospect.id)
  const e = entryOf(state, prospect.id)
  if (e.status !== 'approved') fail(`${prospect.id} は「${STATUS[e.status].label}」です。送信記録は承認済みのものにだけ付けられます。`)
  if (!e.exportedAt) fail('先に export を実行して、送信した文面を確定させてください。')
  e.sentAt = nowIso()
  e.sentVia = args.via && args.via !== true ? args.via : null
  transition(state, prospect.id, 'sent', 'marked_sent', { via: e.sentVia })
  saveState(state)
  console.log(`${green('OK')} ${prospect.id} を送信済みとして記録しました${e.sentVia ? `（経路: ${e.sentVia}）` : ''}。`)
}

function cmdMarkReplied(args) {
  const prospect = findProspect(args['prospect-id'] || args.id || args._[1])
  const outcome = args.outcome
  const allowed = ['accepted', 'declined', 'no-reply', 'other']
  if (!allowed.includes(outcome)) fail(`--outcome を指定してください（${allowed.join(' / ')}）。`)
  const state = loadState()
  warnIfVoided(syncIntegrity(state), prospect.id)
  const e = entryOf(state, prospect.id)
  if (e.status !== 'sent') fail(`${prospect.id} は「${STATUS[e.status].label}」です。返信記録は送信済みのものにだけ付けられます。`)
  e.repliedAt = nowIso()
  e.outcome = outcome
  transition(state, prospect.id, 'replied', 'marked_replied', { outcome, note: args.note || null })
  saveState(state)
  console.log(`${green('OK')} ${prospect.id} の結果を記録しました: ${outcome}`)
  if (outcome === 'accepted') {
    console.log(`\n提携が成立したら:\n  1. 発行されたリンクを lib/affiliates.ts の ${prospect.affiliateKey}.url に貼る`)
    console.log(`  2. ${cyan(`node scripts/outreach-cli.mjs mark-partnered --prospect-id ${prospect.id}`)}`)
  }
}

function cmdMarkPartnered(args) {
  const prospect = findProspect(args['prospect-id'] || args.id || args._[1])
  const state = loadState()
  warnIfVoided(syncIntegrity(state), prospect.id)
  const e = entryOf(state, prospect.id)
  const aff = readAffiliates()[prospect.affiliateKey]
  if (!aff) fail(`lib/affiliates.ts に ${prospect.affiliateKey} がありません。`)
  if (!aff.linked && !args.force) {
    fail(`lib/affiliates.ts の ${prospect.affiliateKey}.url がまだ空です。発行されたリンクを貼ってから実行してください（--force で無視）。`)
  }
  transition(state, prospect.id, 'partnered', 'marked_partnered', { affiliateKey: prospect.affiliateKey })
  saveState(state)
  const places = readPlacements()[prospect.affiliateKey] || []
  console.log(`${green('OK')} ${prospect.id}（${prospect.name}）を提携成立として記録しました。`)
  if (places.length) console.log(`  ${places.length}件の記事でCTAが有効になります。`)
}

// ---------------------------------------------------------------
// コマンド: note / log / verify
// ---------------------------------------------------------------

function cmdNote(args) {
  const prospect = findProspect(args['prospect-id'] || args.id || args._[1])
  const text = args.text || args._.slice(2).join(' ')
  if (!text) fail('メモ本文を指定してください（例: --text "先方から返信、単価要相談"）。')
  const state = loadState()
  const e = entryOf(state, prospect.id)
  e.notes.push({ at: nowIso(), by: args.by && args.by !== true ? args.by : null, text })
  audit({ prospect: prospect.id, action: 'note', text })
  saveState(state)
  console.log(`${green('OK')} メモを追加しました。`)
}

function cmdLog(args) {
  if (!fs.existsSync(AUDIT_FILE)) return void console.log(dim('監査ログはまだありません。'))
  const id = args['prospect-id'] || args.id
  const lines = fs.readFileSync(AUDIT_FILE, 'utf8').trim().split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)
    .filter(r => !id || id === true || r.prospect === String(id).toUpperCase())
  if (args.json) return void console.log(JSON.stringify(lines, null, 2))
  console.log(heading(`監査ログ${id && id !== true ? ` (${String(id).toUpperCase()})` : ''}`))
  for (const r of lines) {
    const who = r.by ? ` by ${r.by}` : ''
    const extra = r.reason ? ` — ${r.reason}` : r.outcome ? ` — ${r.outcome}` : r.via ? ` — ${r.via}` : ''
    console.log(`  ${dim(r.at)}  ${pad(r.prospect || '-', 6)}${pad(r.action, 22)}${who}${extra}`)
  }
  console.log(`\n  ${dim(`${lines.length}件`)}`)
}

function cmdVerify() {
  const state = loadState()
  const voided = syncIntegrity(state)
  const prospects = loadProspects()
  const affiliates = readAffiliates()
  const placements = readPlacements()
  const problems = []

  const seen = new Set()
  for (const p of prospects) {
    if (seen.has(p.id)) problems.push(`ID重複: ${p.id}`)
    seen.add(p.id)
    if (!/^P\d{3}$/.test(p.id)) problems.push(`ID形式が不正: ${p.id}`)
    if (!affiliates[p.affiliateKey]) problems.push(`${p.id}: lib/affiliates.ts に ${p.affiliateKey} がありません`)
    if (!p.company || !p.site) problems.push(`${p.id}: 会社名／公式サイトが未確認です（送付前に台帳を埋めてください）`)
  }
  for (const id of Object.keys(state.prospects || {})) {
    if (!seen.has(id)) problems.push(`state.json に台帳外のID: ${id}`)
  }
  for (const p of prospects) {
    const e = state.prospects[p.id]
    const aff = affiliates[p.affiliateKey]
    if (!aff) continue
    if (aff.linked && (!e || e.status !== 'partnered')) {
      problems.push(`${p.id}: lib/affiliates.ts にリンクがあるのにステータスが「${STATUS[e?.status]?.label || e?.status || '下書き'}」です → mark-partnered を検討`)
    }
    if (!aff.linked && e && e.status === 'partnered') {
      problems.push(`${p.id}: 提携成立なのに ${p.affiliateKey}.url が空です`)
    }
  }
  for (const key of Object.keys(placements)) {
    if (!affiliates[key]) problems.push(`記事内の {{AFF:${key}}} が lib/affiliates.ts に未登録です`)
  }
  for (const v of voided) problems.push(`${v.id}: ${v.reason}（承認を失効させました）`)

  console.log(heading('整合性チェック'))
  if (!problems.length) {
    console.log(`  ${green('問題は見つかりませんでした。')}`)
  } else {
    for (const p of problems) console.log(`  ${yellow('!')} ${p}`)
    console.log(`\n  ${problems.length}件`)
  }
  process.exitCode = problems.length ? 1 : 0
}

// ---------------------------------------------------------------
// help / ディスパッチ
// ---------------------------------------------------------------

function cmdHelp() {
  console.log(`
${bold('AIツールナビ 提携アウトリーチ CLI')}

  ${dim('未提携のアフィリエイトプログラムへの打診を、人間の承認を挟んで管理します。')}
  ${dim('このCLIはメールを送信しません。承認済みの文面を書き出すところまでを担当します。')}

${bold('確認する')}
  list [--status <状態>] [--category <語>] [--json]   台帳を優先度順に表示
  brief --prospect-id <ID> [--json]                   連絡前のブリーフを表示
  status [--json]                                     パイプラインの件数
  log [--prospect-id <ID>] [--json]                   監査ログ
  verify                                              台帳・状態・記事の整合性チェック

${bold('進める')}
  draft  --prospect-id <ID> [--force]                 下書きを生成（要編集）
  submit --prospect-id <ID>                           承認依頼（空欄が残っていると不可）
  approve --prospect-id <ID> --by <名前> [--note ..]  承認（本文ハッシュに紐づく）
  reject  --prospect-id <ID> --by <名前> --reason ..  差し戻し
  export --prospect-id <ID>                           承認済み文面を outbox に書き出す
  send   --prospect-id <ID> [--confirm] [--verbose]   メールを送信（--confirm なしはドライラン）
  mark-sent --prospect-id <ID> [--via <経路>]         手動で送った場合に記録（ASPフォーム等）
  mark-replied --prospect-id <ID> --outcome <結果>    返信を記録 (accepted/declined/no-reply/other)
  mark-partnered --prospect-id <ID>                   提携成立を記録
  note --prospect-id <ID> --text <メモ>               メモを追加

${bold('承認のルール')}
  ・【要記入】が残っている文面は submit も approve もできません
  ・承認は承認時の本文のSHA-256に紐づきます。承認後に編集すると承認は自動失効します
  ・export / send ができるのは承認済みで、かつ文面が承認時から変わっていないものだけです
  ・承認は宛先にも紐づきます。承認後に contact.email を変えると承認は失効します
  ・send は既定でドライランです。--confirm を付けたときだけ実際に送信します
  ・送信は1回につき1件のみ。一斉送信の機能はありません（既定の上限は24時間で20件）

${dim('例: node scripts/outreach-cli.mjs brief --prospect-id P002')}
`)
}

const COMMANDS = {
  list: cmdList,
  brief: cmdBrief,
  status: cmdStatus,
  draft: cmdDraft,
  submit: cmdSubmit,
  approve: cmdApprove,
  reject: cmdReject,
  export: cmdExport,
  send: cmdSend,
  'mark-sent': cmdMarkSent,
  'mark-replied': cmdMarkReplied,
  'mark-partnered': cmdMarkPartnered,
  note: cmdNote,
  log: cmdLog,
  verify: cmdVerify,
  help: cmdHelp,
}


// ---------------------------------------------------------------
// メール送信
//   承認ゲートを通ったものだけを、1件ずつ送る。
//   既定は必ずドライラン。実送信には --confirm が要る。
// ---------------------------------------------------------------

/** .env.outreach を読み込む（コミット禁止・既存の環境変数は上書きしない） */
function loadEnvFile() {
  const file = path.join(ROOT, '.env.outreach')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (!m) continue
    const key = m[1]
    let val = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

function smtpConfig() {
  loadEnvFile()
  const env = process.env
  return {
    host: env.OUTREACH_SMTP_HOST || 'smtp.gmail.com',
    port: Number(env.OUTREACH_SMTP_PORT || 465),
    // 既定では465番のみ暗黙TLS。それ以外はSTARTTLSで暗号化する
    secure: env.OUTREACH_SMTP_SECURE ? env.OUTREACH_SMTP_SECURE === 'true' : undefined,
    user: env.OUTREACH_SMTP_USER || '',
    pass: env.OUTREACH_SMTP_PASS || '',
    fromEmail: env.OUTREACH_FROM_EMAIL || env.OUTREACH_SMTP_USER || '',
    fromName: env.OUTREACH_FROM_NAME || '',
    replyTo: env.OUTREACH_REPLY_TO || '',
    bcc: (env.OUTREACH_BCC || '').split(',').map(s => s.trim()).filter(Boolean),
    dailyLimit: Number(env.OUTREACH_DAILY_LIMIT || 20),
  }
}

/** 下書き本文を「件名」と「本文」に分解する */
function parseMessage(body) {
  const m = body.match(/##\s*件名\s*\n([\s\S]*?)\n##\s*本文\s*\n([\s\S]*)$/)
  if (!m) return { error: '下書きの形式が不正です（「## 件名」と「## 本文」が必要です）' }
  const subject = m[1].trim()
  const text = m[2].trim()
  if (!subject) return { error: '件名が空です' }
  if (subject.includes('\n')) return { error: '件名が複数行になっています。1行にしてください' }
  if (!text) return { error: '本文が空です' }
  return { subject, text }
}

/** 直近24時間の送信数（暴走・大量送信の歯止め） */
function sentInLast24h() {
  if (!fs.existsSync(AUDIT_FILE)) return 0
  const since = Date.now() - 24 * 60 * 60 * 1000
  let n = 0
  for (const line of fs.readFileSync(AUDIT_FILE, 'utf8').split('\n')) {
    if (!line.trim()) continue
    try {
      const r = JSON.parse(line)
      if (r.action === 'email_sent' && new Date(r.at).getTime() >= since) n++
    } catch { /* 壊れた行は無視 */ }
  }
  return n
}

const recipientOf = prospect => (prospect.contact && prospect.contact.email) || ''

/**
 * エラー文から認証情報を取り除く（多層防御）。
 * SMTPクライアント側でも伏字にしているが、監査ログは追記専用で
 * 一度混入すると消せないため、書き出す直前にもう一度通す。
 */
function redactSecrets(text, cfg) {
  let out = String(text)
  const secrets = [cfg.pass, cfg.user]
    .filter(Boolean)
    .flatMap(v => [v, Buffer.from(v, 'utf8').toString('base64')])
  secrets.push(Buffer.from(`\0${cfg.user}\0${cfg.pass}`, 'utf8').toString('base64'))
  for (const sec of secrets) {
    if (sec) out = out.split(sec).join('<伏字>')
  }
  // 取りこぼし対策: 長いbase64列は中身に関わらず伏せる
  return out.replace(/[A-Za-z0-9+/]{16,}={0,2}/g, '<伏字>')
}

async function cmdSend(args) {
  const prospect = findProspect(args['prospect-id'] || args.id || args._[1])
  const state = loadState()
  const voided = syncIntegrity(state)
  if (voided.length) saveState(state)
  const e = entryOf(state, prospect.id)

  // --- ゲート1: 承認済みであること ---
  if (e.status !== 'approved') {
    fail(`${prospect.id} は「${STATUS[e.status].label}」です。送信できるのは承認済みのものだけです。`,
      e.status === 'sent' ? '  既に送信済みです。重複送信を防ぐため拒否しました。'
        : e.status === 'pending' ? '  承認者による approve が必要です。'
        : `  submit → approve を実行してください。`)
  }

  // --- ゲート2: 文面が承認時から変わっていないこと ---
  const d = readDraft(prospect.id)
  if (!d) fail('下書きが見つかりません。')
  if (d.hash !== e.approvedHash) {
    fail('承認後に下書きが変更されています。submit からやり直してください。')
  }

  // --- ゲート3: 承認済み文面が書き出されていること ---
  if (!e.exportedAt || !fs.existsSync(outboxPath(prospect.id))) {
    fail(`先に export を実行してください: node scripts/outreach-cli.mjs export --prospect-id ${prospect.id}`)
  }
  const outbox = fs.readFileSync(outboxPath(prospect.id), 'utf8')
  if (sha256(outbox.trim()) !== e.approvedHash) {
    fail('outbox のファイルが承認済みの文面と一致しません。export をやり直してください。')
  }

  // --- ゲート4: 宛先が台帳にあり、承認時から変わっていないこと ---
  const to = recipientOf(prospect)
  if (!to) {
    fail(`${prospect.id} の宛先メールアドレスが台帳に登録されていません。`,
      `  outreach/prospects.json の ${prospect.id} → contact.email に、公式サイトで確認した\n` +
      `  実在のアドレスを記入してください（推測で書かないこと）。\n` +
      `  宛先を変更すると承認は失効し、再承認が必要になります。`)
  }
  if (!isValidEmail(to)) fail(`宛先の形式が不正です: ${to}`)
  // 承認時の宛先と完全一致する場合のみ送る。
  // approvedRecipient が無い記録は「宛先未承認」として扱い、必ず再承認させる。
  if (e.approvedRecipient !== to) {
    fail(`承認された宛先と一致しません。再承認が必要です。`,
      `  承認時: ${e.approvedRecipient || '（記録なし）'}\n  現在  : ${to}`)
  }

  // --- ゲート5: チャネルの整合（ASP経由の相手にメールを送らない） ---
  if (prospect.channel === 'asp' && !args.force) {
    fail(`${prospect.id} は「ASP経由」の相手です（${prospect.aspHint || 'ASP'}）。`,
      '  提携申請はASPのフォームから行うのが本来の経路です。\n' +
      '  それでもメールを送るなら --force を付けてください。')
  }

  // --- ゲート6: 送信設定 ---
  const cfg = smtpConfig()
  const missing = ['user', 'pass'].filter(k => !cfg[k])
  if (missing.length) {
    fail('送信用のSMTP設定がありません。',
      `  .env.outreach を作るか、環境変数を設定してください:\n\n` +
      `    OUTREACH_SMTP_USER=あなたのアドレス@gmail.com\n` +
      `    OUTREACH_SMTP_PASS=アプリパスワード（Gmailの通常のパスワードではありません）\n` +
      `    OUTREACH_FROM_NAME=AIツールナビ 編集部\n\n` +
      `  Gmailの場合、2段階認証を有効にしたうえで「アプリパスワード」を発行してください。\n` +
      `  .env.outreach は .gitignore 済みです。絶対にコミットしないでください。`)
  }
  if (!isValidEmail(cfg.fromEmail)) fail(`差出人アドレスの形式が不正です: ${cfg.fromEmail}`)

  // --- ゲート7: 1日の送信上限 ---
  const sent24 = sentInLast24h()
  if (sent24 >= cfg.dailyLimit) {
    fail(`直近24時間の送信が上限（${cfg.dailyLimit}件）に達しています。`,
      '  大量送信を防ぐための制限です。OUTREACH_DAILY_LIMIT で変更できます。')
  }

  const parsed = parseMessage(d.body)
  if (parsed.error) fail(parsed.error)

  // --- 送信内容の提示 ---
  console.log(heading(`メール送信${args.confirm ? '' : '（ドライラン）'}  ${prospect.id} / ${prospect.name}`))
  console.log(row('送信元', `${cfg.fromName ? cfg.fromName + ' ' : ''}<${cfg.fromEmail}>`))
  console.log(row('宛先', bold(to)))
  if (cfg.bcc.length) console.log(row('BCC', cfg.bcc.join(', ')))
  if (cfg.replyTo) console.log(row('返信先', cfg.replyTo))
  console.log(row('件名', parsed.subject))
  console.log(row('SMTP', `${cfg.host}:${cfg.port}  ${dim('（パスワードは表示しません）')}`))
  console.log(row('承認者', `${e.approvedBy}  ${dim(e.approvedAt)}`))
  console.log(row('本文ハッシュ', dim(e.approvedHash.slice(0, 16))))
  console.log(row('24時間の送信数', `${sent24} / ${cfg.dailyLimit}`))
  console.log(`\n${dim('--- 本文 ---')}`)
  console.log(parsed.text)
  console.log(dim('--- 本文ここまで ---'))

  if (!args.confirm) {
    console.log(`\n${yellow('これはドライランです。メールは送信していません。')}`)
    console.log(`実際に送るには --confirm を付けてください:`)
    console.log(`  ${cyan(`node scripts/outreach-cli.mjs send --prospect-id ${prospect.id} --confirm`)}`)
    return
  }

  // --- 実送信 ---
  console.log(`\n送信中...`)
  let result
  try {
    result = await sendMail({
      host: cfg.host, port: cfg.port, secure: cfg.secure, user: cfg.user, pass: cfg.pass,
      from: cfg.fromEmail, fromName: cfg.fromName,
      to: [to], bcc: cfg.bcc, replyTo: cfg.replyTo || undefined,
      subject: parsed.subject, text: parsed.text,
      onLog: args.verbose
        ? (dir, line) => console.log(dim(`  ${dir}: ${redactSecrets(line.split('\n')[0], cfg)}`))
        : undefined,
    })
  } catch (err) {
    const safe = redactSecrets(err.message || String(err), cfg).slice(0, 300)
    audit({ prospect: prospect.id, action: 'email_failed', to, error: safe })
    fail(`送信に失敗しました: ${safe}`,
      '  ステータスは「承認済み」のままです。原因を直してから再実行してください。')
  }

  e.sentAt = nowIso()
  e.sentVia = `smtp:${cfg.host}`
  e.messageId = result.messageId
  transition(state, prospect.id, 'sent', 'email_sent', {
    to, via: e.sentVia, messageId: result.messageId, by: e.approvedBy,
  })
  saveState(state)

  console.log(`\n${green('送信しました')} → ${to}`)
  console.log(row('Message-ID', result.messageId))
  console.log(`\n返信があったら:\n  ${cyan(`node scripts/outreach-cli.mjs mark-replied --prospect-id ${prospect.id} --outcome accepted`)}`)
}

// --- 実行（recipientOf などの const 定義より後に置く必要がある） ---
const args = parseArgs(process.argv.slice(2))
const command = args._[0] || (args.help ? 'help' : null)
if (!command) { cmdHelp(); process.exit(0) }
const handler = COMMANDS[command]
if (!handler) {
  fail(`不明なコマンド: ${command}`, `  使えるコマンド: ${Object.keys(COMMANDS).join(', ')}\n  詳細: node scripts/outreach-cli.mjs help`)
}
const release = acquireLock()
try {
  await handler(args)
} catch (err) {
  fail(err && err.message ? err.message : String(err))
} finally {
  release()
}
