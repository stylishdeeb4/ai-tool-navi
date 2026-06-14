# GitHub + Vercel デプロイ手順

## 1. ローカルでの動作確認

```bash
# プロジェクトフォルダに移動
cd ai-tool-navi

# 依存パッケージをインストール
npm install

# 開発サーバーを起動
npm run dev
# → http://localhost:3000 で確認
```

---

## 2. GitHubにリポジトリを作成・プッシュ

### 2-1. GitHubでリポジトリ作成

1. [github.com](https://github.com) にログイン
2. 右上の「+」→「New repository」
3. Repository name: `ai-tool-navi`
4. Public を選択（SEOサイトなのでPublicでOK）
5. 「Create repository」をクリック

### 2-2. ローカルからプッシュ

```bash
# ai-tool-navi フォルダ内で実行
git init
git add .
git commit -m "first commit: AI tool navi site"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/ai-tool-navi.git
git push -u origin main
```

---

## 3. Vercelにデプロイ

### 3-1. Vercelアカウント作成

1. [vercel.com](https://vercel.com) にアクセス
2. 「Sign Up」→ 「Continue with GitHub」でGitHub連携

### 3-2. プロジェクトをインポート

1. Vercelダッシュボードで「Add New → Project」
2. GitHubリポジトリ一覧から `ai-tool-navi` を選択
3. 「Import」をクリック

### 3-3. 環境変数の設定

「Environment Variables」セクションで以下を設定：

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://ai-tool-navi.vercel.app`（後で変更可） |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | （AdSense審査通過後に設定） |

### 3-4. デプロイ実行

「Deploy」をクリック → 1〜2分でデプロイ完了！

🎉 `https://ai-tool-navi.vercel.app` でサイトが公開されます。

---

## 4. カスタムドメインの設定（任意・おすすめ）

SEO的にはカスタムドメインが有利です。

### ドメイン取得

- [お名前.com](https://www.onamae.com/) や [ムームードメイン](https://muumuu-domain.com/) で取得
- `.com` や `.jp` がおすすめ（年間1,000〜2,000円）

### Vercelへの設定

1. Vercelダッシュボード → Settings → Domains
2. 取得したドメインを入力
3. ドメイン管理画面でDNSレコードを設定（Vercelが手順を案内してくれます）

---

## 5. Google AdSense 審査申請

サイト公開後、以下の準備ができたらAdSense申請：

### 申請前チェックリスト

- [ ] 記事が20本以上ある
- [ ] プライバシーポリシーページがある（`/privacy`）
- [ ] お問い合わせページがある（`/contact`）
- [ ] 独自ドメインを設定している（推奨）
- [ ] コンテンツが独自性のある内容になっている

### 申請手順

1. [Google AdSense](https://www.google.com/adsense/) にアクセス
2. サイトURLを入力して申請
3. `<script>` タグを `app/layout.tsx` の `NEXT_PUBLIC_ADSENSE_CLIENT_ID` に設定
4. 審査結果を待つ（数日〜2週間）

---

## 6. 記事を増やす

新しい記事は `content/posts/` にMDXファイルを追加するだけです：

```markdown
---
title: "記事タイトル"
description: "記事の説明（120字程度）"
date: "2025-07-01"
category: "ChatGPT"
tags: ["ChatGPT", "活用術"]
---

記事本文をここに書く...
```

GitにPushするとVercelが自動的に再デプロイします。

---

## 7. SEO強化ロードマップ

| 時期 | タスク |
|------|--------|
| 公開直後 | Google Search Console に登録してサイトマップを送信 |
| 2ヶ月後 | 記事20本達成・AdSense申請 |
| 3ヶ月後 | 記事30本・検索流入を確認 |
| 6ヶ月後 | 月1万PV目標・収益化開始 |

### Google Search Console 設定

1. [search.google.com/search-console](https://search.google.com/search-console) にアクセス
2. サイトURLを追加
3. サイトマップ送信：`https://your-site.vercel.app/sitemap.xml`

---

## トラブルシューティング

**ビルドエラーが出る場合**
```bash
npm run build
```
でエラーを確認し、TypeScriptのエラーを修正する。

**記事が表示されない場合**
- `content/posts/` にMDXファイルがあるか確認
- frontmatterの形式（`---`の間に設定）が正しいか確認

**画像が遅い場合**
- `next/image` コンポーネントを使う
- 画像はWebP形式で用意する（100KB以下推奨）
