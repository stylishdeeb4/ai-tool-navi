# 提携アウトリーチ（運用手順）

未提携のアフィリエイトプログラムへ提携を打診するまでの流れを、
**人間の承認を必ず挟む形**で管理するための仕組みです。

- CLI: `scripts/outreach-cli.mjs`（Node標準機能のみ・依存パッケージなし）
- レビュー用スラッシュコマンド: `/outreach-approval`

```
node scripts/outreach-cli.mjs help     # コマンド一覧
npm run outreach -- brief --prospect-id P002
```

## このツールがやらないこと

- **メールを送信しません。** `export` は承認済みの文面を `outreach/outbox/` に書き出すだけで、
  実際の送信は人間が行います。
- **数値を推測で埋めません。** PV・UU・収益はリポジトリから取得できないため `【要記入】` として残します。
- **未確認の会社名・連絡先を作りません。** 台帳の `company` / `site` / `contact` が空のものは
  「未確認」であり、公式サイトで確認して埋めるまでは送付前チェックが通りません。

## 流れ

```
draft ──> submit ──> approve ──> export ──> mark-sent ──> mark-replied ──> mark-partnered
 下書き   承認依頼    承認(人間)   書き出し    送信記録        返信記録         提携成立
              ^          |
              └── reject ┘（差し戻し）
```

```bash
# 1. 誰に連絡すべきかを見る（優先度＝掲載待ちの枠数 × 単価帯）
node scripts/outreach-cli.mjs list

# 2. 連絡前のブリーフを読む
node scripts/outreach-cli.mjs brief --prospect-id P002

# 3. 下書きを生成し、【要記入】欄を自分で埋める
node scripts/outreach-cli.mjs draft --prospect-id P002
$EDITOR outreach/drafts/P002.md

# 4. 承認依頼 →（レビュー）→ 承認
node scripts/outreach-cli.mjs submit  --prospect-id P002
node scripts/outreach-cli.mjs approve --prospect-id P002 --by "あなたの名前"

# 5. 承認済みの文面を書き出して、自分で送る
node scripts/outreach-cli.mjs export --prospect-id P002
node scripts/outreach-cli.mjs mark-sent --prospect-id P002 --via "A8.net 提携申請"

# 6. 結果を記録する
node scripts/outreach-cli.mjs mark-replied --prospect-id P002 --outcome accepted
#   → 発行されたリンクを lib/affiliates.ts の該当キー .url に貼る
node scripts/outreach-cli.mjs mark-partnered --prospect-id P002
```

## 承認のルール

1. `【要記入】` が残っている文面は `submit` も `approve` もできません。
2. `approve` には `--by <名前>` が必須です。誰が承認したか残らない承認は受け付けません。
3. **承認は承認時の本文のSHA-256に紐づきます。**
   承認後に下書きを1文字でも編集すると承認は自動的に失効し（監査ログに `approval_invalidated` が残る）、
   `submit` からやり直しになります。
4. `export` できるのは、承認済みかつ文面が承認時から変わっていないものだけです。

`/outreach-approval` は、この承認の材料を揃えるためのレビュー用コマンドです。
レビュー担当のAIは `approve` / `reject` / `export` を実行しません（承認は人間の行為のため）。

## ファイル

| ファイル | 役割 | 手で編集するか |
|---|---|---|
| `prospects.json` | プロスペクト台帳（ID・会社名・連絡先・依頼内容） | **する**（会社名・URL・連絡先を確認して埋める） |
| `drafts/<ID>.md` | 生成された下書き。ヘッダは送信されない | **する**（【要記入】を埋める） |
| `outbox/<ID>.txt` | 承認済みの送信用テキスト | しない（`export` が生成） |
| `state.json` | 各プロスペクトの状態・承認記録 | しない（CLIが管理） |
| `audit.log.jsonl` | 追記のみの監査ログ | しない（追記専用） |

`prospects.json` の `id` は変更しないでください（`state.json` と監査ログが `id` で紐づいています）。

## 台帳の増やし方

`lib/affiliates.ts` にキーを追加し、記事に `{{AFF:<キー>}}` を置いたら、
`prospects.json` に同じ `affiliateKey` のレコードを追加します（`id` は連番）。
`node scripts/outreach-cli.mjs verify` で、台帳・記事・`lib/affiliates.ts` の食い違いを検出できます。

---

## メール送信（send）

`export` までは「文面を書き出す」だけですが、`send` は**実際にメールを送信します**。

### 送信できる条件（すべて満たす必要があります）

1. ステータスが「承認済み」であること
2. 承認後に下書きが編集されていないこと（本文のSHA-256が一致）
3. `export` 済みで、outbox のファイルが承認済み文面と一致すること
4. `prospects.json` の `contact.email` に宛先が入っており、**承認時の宛先と同じ**であること
5. SMTPの認証情報が設定されていること
6. 直近24時間の送信数が上限（既定20件）未満であること
7. `--confirm` が付いていること（付けない場合はドライラン）

どれか1つでも欠けると送信は行われません。

### 承認は「文面」と「宛先」の両方に紐づきます

承認後に文面を編集しても、`contact.email` を書き換えても、承認は自動的に失効して「下書き」に戻ります。
監査ログには `approval_invalidated` として理由（`draft_modified` / `recipient_changed`）が記録されます。

承認済みの文面を、承認者が知らない別の会社へ送る、という事故を防ぐための仕様です。

### 初期設定

```bash
cp .env.outreach.example .env.outreach
# .env.outreach を編集して OUTREACH_SMTP_USER と OUTREACH_SMTP_PASS を入れる
```

Gmailを使う場合、**通常のログインパスワードでは送信できません**。
2段階認証を有効にしたうえで、[アプリパスワード](https://myaccount.google.com/apppasswords)を発行して使ってください。

`.env.outreach` は `.gitignore` 済みです。絶対にコミットしないでください。

### 送信の手順

```bash
# 1. まずドライラン。宛先・件名・本文を目で確認する
node scripts/outreach-cli.mjs send --prospect-id P004

# 2. 問題なければ --confirm を付けて実送信
node scripts/outreach-cli.mjs send --prospect-id P004 --confirm
```

送信に成功すると、ステータスが「送信済み」になり、Message-ID が監査ログに残ります。
送信に失敗した場合、ステータスは「承認済み」のまま変わりません（再実行できます）。

### ASP経由の相手には使いません

`channel` が `asp` のプロスペクト（クラウドワークス、ランサーズなど）は、
提携申請をASPのフォームから行うのが本来の経路です。
そのためメール送信は既定で拒否されます。手動で送った場合は `mark-sent` で記録してください。

### 意図的に作っていない機能

- **一斉送信** — 1回の実行で1件だけです。複数を一度に送る機能はありません
- **宛先のコマンドライン指定** — 宛先は台帳（バージョン管理下）からのみ取得します。`--to` はありません
- **添付ファイル・HTMLメール** — テキストメールのみです
