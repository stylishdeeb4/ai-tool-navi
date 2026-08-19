// =============================================================
// 最小構成のSMTPクライアント（依存パッケージなし）
// -------------------------------------------------------------
// アウトリーチCLIから1通ずつメールを送るためだけの実装です。
// Next.jsのデプロイに影響を出さないよう、外部パッケージを使いません。
//
// 対応:
//   ・ポート465（暗黙TLS）／ポート587（STARTTLS）
//   ・AUTH LOGIN / AUTH PLAIN
//   ・日本語の件名・本文（UTF-8 + Base64。文字化けと行長の問題を回避）
//
// 非対応（意図的に作っていません）:
//   ・添付ファイル、HTMLメール、複数宛先への一斉送信
// =============================================================

import net from 'node:net'
import tls from 'node:tls'
import crypto from 'node:crypto'

const CRLF = '\r\n'

/** ヘッダに改行を入れられるとヘッダインジェクションになるため必ず弾く */
function assertNoCRLF(value, label) {
  if (/[\r\n]/.test(String(value))) {
    throw new Error(`${label} に改行を含めることはできません（ヘッダインジェクション防止）`)
  }
  return String(value)
}

/** メールアドレスの最低限の検証 */
export function isValidEmail(addr) {
  if (typeof addr !== 'string') return false
  if (/[\r\n\s]/.test(addr)) return false
  return /^[^@,;<>]+@[^@,;<>.]+\.[^@,;<>]+$/.test(addr.trim())
}

/**
 * RFC 2047 のエンコードワード化。
 * 非ASCIIを含むヘッダ（日本語の件名・差出人名）に使う。
 * 1ワード75文字以内の制約に収まるよう、文字境界で分割する。
 */
export function encodeHeaderWord(str) {
  const s = String(str)
  if (!/[^\x20-\x7e]/.test(s)) return s // ASCIIのみならそのまま

  const chunks = []
  let current = ''
  let currentBytes = 0
  // "=?UTF-8?B?" (10) + "?=" (2) = 12文字。75-12=63、Base64は4文字単位なので60文字＝45バイトまで
  const MAX_BYTES = 45
  for (const ch of s) {
    const b = Buffer.byteLength(ch, 'utf8')
    if (currentBytes + b > MAX_BYTES) {
      chunks.push(current)
      current = ''
      currentBytes = 0
    }
    current += ch
    currentBytes += b
  }
  if (current) chunks.push(current)

  return chunks
    .map(c => `=?UTF-8?B?${Buffer.from(c, 'utf8').toString('base64')}?=`)
    .join(`${CRLF} `)
}

/** 表示名つきアドレス "名前 <addr@example.com>" を組み立てる */
export function formatAddress(email, name) {
  const addr = assertNoCRLF(email, 'メールアドレス')
  if (!name) return `<${addr}>`
  return `${encodeHeaderWord(assertNoCRLF(name, '差出人名'))} <${addr}>`
}

/** RFC 5322 形式の日付 */
function rfc5322Date(d = new Date()) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const p = n => String(n).padStart(2, '0')
  const off = -d.getTimezoneOffset()
  const sign = off >= 0 ? '+' : '-'
  const oh = p(Math.floor(Math.abs(off) / 60))
  const om = p(Math.abs(off) % 60)
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ` +
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} ${sign}${oh}${om}`
}

/** 本文をUTF-8のBase64にして76文字で折り返す（行長・ドットスタッフィング問題を回避） */
function encodeBody(text) {
  const b64 = Buffer.from(String(text).replace(/\r?\n/g, CRLF), 'utf8').toString('base64')
  return (b64.match(/.{1,76}/g) || ['']).join(CRLF)
}

/** 送信するメール本体（ヘッダ＋本文）を組み立てる */
export function buildMessage({ from, fromName, to, replyTo, cc, bcc, subject, text, messageId }) {
  const id = messageId || `<${crypto.randomUUID()}@${String(from).split('@')[1] || 'localhost'}>`
  const headers = [
    `Date: ${rfc5322Date()}`,
    `From: ${formatAddress(from, fromName)}`,
    `To: ${to.map(a => formatAddress(a)).join(', ')}`,
  ]
  if (cc && cc.length) headers.push(`Cc: ${cc.map(a => formatAddress(a)).join(', ')}`)
  if (replyTo) headers.push(`Reply-To: ${formatAddress(replyTo)}`)
  headers.push(`Subject: ${encodeHeaderWord(assertNoCRLF(subject, '件名'))}`)
  headers.push(`Message-ID: ${assertNoCRLF(id, 'Message-ID')}`)
  headers.push('MIME-Version: 1.0')
  headers.push('Content-Type: text/plain; charset=UTF-8')
  headers.push('Content-Transfer-Encoding: base64')
  // Bccはヘッダに書かない（受信者に見えてしまうため）。RCPT TO でのみ指定する。
  return { id, data: headers.join(CRLF) + CRLF + CRLF + encodeBody(text) }
}

// ---------------------------------------------------------------
// SMTPの会話部分
// ---------------------------------------------------------------

class SmtpSession {
  constructor(socket, timeoutMs, onLog) {
    this.socket = socket
    this.timeoutMs = timeoutMs
    this.onLog = onLog || (() => {})
    this.buffer = ''
    this.pending = null
    socket.setEncoding('utf8')
    socket.on('data', chunk => this._onData(chunk))
  }

  _onData(chunk) {
    this.buffer += chunk
    if (!this.pending) return
    // 応答は "250-..." が続き、最後が "250 ..."（数字のあとが半角スペース）で終わる
    const lines = this.buffer.split(CRLF)
    for (let i = 0; i < lines.length; i++) {
      if (/^\d{3} /.test(lines[i])) {
        const consumed = lines.slice(0, i + 1)
        this.buffer = lines.slice(i + 1).join(CRLF)
        const text = consumed.join('\n')
        const code = parseInt(text.slice(0, 3), 10)
        const p = this.pending
        this.pending = null
        clearTimeout(p.timer)
        this.onLog('S', text)
        p.resolve({ code, text })
        return
      }
    }
  }

  /** 応答を1つ待つ */
  read() {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending = null
        reject(new Error(`SMTPサーバーからの応答がありません（${this.timeoutMs}ms）`))
      }, this.timeoutMs)
      this.pending = { resolve, reject, timer }
      this._onData('') // 既に届いている分を処理
    })
  }

  /** コマンドを送って応答を待ち、期待するコードでなければ例外にする */
  async command(line, expected, { secret = false } = {}) {
    this.onLog('C', secret ? '<認証情報は表示しません>' : line)
    this.socket.write(line + CRLF)
    const res = await this.read()
    if (expected && !expected.includes(res.code)) {
      throw new Error(`SMTPエラー: "${line.split(' ')[0]}" に対して ${res.code}\n${res.text}`)
    }
    return res
  }
}

/** IPアドレス宛てにSNIを送るのはRFC 6066違反なので付けない */
function sniFor(host) {
  return /^[\d.]+$/.test(host) || host.includes(':') ? undefined : host
}

function connect({ host, port, secure, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const onError = err => reject(new Error(`${host}:${port} に接続できません: ${err.message}`))
    const socket = secure
      ? tls.connect({ host, port, servername: sniFor(host) }, () => resolve(socket))
      : net.connect({ host, port }, () => resolve(socket))
    socket.setTimeout(timeoutMs, () => {
      socket.destroy()
      reject(new Error(`${host}:${port} への接続がタイムアウトしました`))
    })
    socket.once('error', onError)
  })
}

/**
 * メールを1通送信する。
 * 成功すると { messageId, response } を返し、失敗すると例外を投げる。
 */
export async function sendMail(opts) {
  const {
    host, port = 465, secure: secureOpt, user, pass,
    from, fromName, to, cc = [], bcc = [], replyTo,
    subject, text,
    timeoutMs = 30000,
    onLog,
  } = opts

  const recipients = [...to, ...cc, ...bcc]
  if (!recipients.length) throw new Error('宛先が指定されていません')
  for (const addr of [from, ...recipients, ...(replyTo ? [replyTo] : [])]) {
    if (!isValidEmail(addr)) throw new Error(`メールアドレスの形式が不正です: ${addr}`)
  }

  const secure = secureOpt === undefined ? Number(port) === 465 : Boolean(secureOpt)
  let socket = await connect({ host, port: Number(port), secure, timeoutMs })
  let session = new SmtpSession(socket, timeoutMs, onLog)

  try {
    const greeting = await session.read()
    if (greeting.code !== 220) throw new Error(`SMTPサーバーの応答が不正です: ${greeting.text}`)

    const ehloName = 'localhost'
    let ehlo = await session.command(`EHLO ${ehloName}`, [250])

    // 587番ポートなどでは STARTTLS で暗号化に切り替える
    if (!secure) {
      if (!/STARTTLS/i.test(ehlo.text)) {
        throw new Error('サーバーがSTARTTLSに対応していません。暗号化されない接続では送信しません。')
      }
      await session.command('STARTTLS', [220])
      socket.removeAllListeners('data')
      const upgraded = await new Promise((resolve, reject) => {
        const s = tls.connect({ socket, servername: sniFor(host) }, () => resolve(s))
        s.once('error', reject)
      })
      socket = upgraded
      session = new SmtpSession(socket, timeoutMs, onLog)
      ehlo = await session.command(`EHLO ${ehloName}`, [250])
    }

    // 認証
    if (user) {
      if (/AUTH[ =-][^\n]*LOGIN/i.test(ehlo.text)) {
        await session.command('AUTH LOGIN', [334])
        await session.command(Buffer.from(user, 'utf8').toString('base64'), [334], { secret: true })
        await session.command(Buffer.from(pass, 'utf8').toString('base64'), [235], { secret: true })
      } else if (/AUTH[ =-][^\n]*PLAIN/i.test(ehlo.text)) {
        const token = Buffer.from(`\0${user}\0${pass}`, 'utf8').toString('base64')
        await session.command(`AUTH PLAIN ${token}`, [235], { secret: true })
      } else {
        throw new Error('サーバーが AUTH LOGIN / AUTH PLAIN に対応していません')
      }
    }

    const { id, data } = buildMessage({ from, fromName, to, cc, bcc, replyTo, subject, text })

    await session.command(`MAIL FROM:<${from}>`, [250])
    for (const rcpt of recipients) {
      await session.command(`RCPT TO:<${rcpt}>`, [250, 251])
    }
    await session.command('DATA', [354])
    session.socket.write(data + CRLF + '.' + CRLF)
    const res = await session.read()
    if (res.code !== 250) throw new Error(`送信が受け付けられませんでした: ${res.text}`)

    try { await session.command('QUIT', [221]) } catch { /* QUITの失敗は無視してよい */ }
    return { messageId: id, response: res.text }
  } finally {
    socket.destroy()
  }
}
