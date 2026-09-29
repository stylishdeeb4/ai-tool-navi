// カテゴリの単一情報源（スラッグ ⇔ 表示名）
// ナビ・カテゴリページ・記事バッジはすべてここを参照する。

export interface Category {
  slug: string
  name: string
  description: string
  /** カテゴリページ冒頭の説明文（何がわかるカテゴリかを読者に伝える） */
  intro: string
  /** 最初に読んでほしい記事のスラッグ */
  pillar: string
}

export const categories: Category[] = [
  { slug: 'chatgpt', name: 'ChatGPT', description: '使い方・プロンプト・活用例', pillar: 'chatgpt-tsukaikata-kanzen-guide',
    intro: 'ChatGPTの登録や基本操作から、回答の質を上げる指示の出し方、仕事や副業での使い方までをまとめています。はじめての方は、使い方ガイドから読み進めてください。' },
  { slug: 'claude', name: 'Claude', description: '文章作成と日々の作業に', pillar: 'claude-tsukaikata-guide',
    intro: 'Anthropicが提供するAI「Claude」の始め方と、文章作成や長い資料の読み込みなど、得意な作業での使い方を紹介します。ChatGPTとの違いを知りたい方は比較記事もあわせてご覧ください。' },
  { slug: 'image-ai', name: '画像生成AI', description: '画像づくりの手順と選び方', pillar: 'gazou-seisei-ai-osusume',
    intro: 'ブログのアイキャッチやSNS画像を作るためのツール選び、思いどおりの画像に近づけるプロンプトの書き方、公開・販売前に確認したい著作権と利用規約をまとめています。' },
  { slug: 'video-ai', name: 'AI動画', description: '動画づくりのツールと活用法', pillar: 'ai-douga-seisei-tool',
    intro: 'テキストや画像から動画を作るAIツールの選び方と、ショート動画などへの活かし方を紹介します。YouTubeショートを副業にする方法は、副業・収益化カテゴリの記事で詳しく解説しています。' },
  { slug: 'fukugyo', name: '副業・収益化', description: '始める準備とブログ運営', pillar: 'ai-fukugyo-osusume-15',
    intro: 'AIを使った副業の選び方から、ブログ・ライティング・Kindle出版などの始め方、怪しい案件の見分け方、税金と確定申告までを扱います。目的別ガイドの順に読むと、必要な準備を漏れなく確認できます。' },
  { slug: 'review', name: '比較・レビュー', description: '目的と利用条件から比較', pillar: 'ai-tool-osusume-2026',
    intro: 'ChatGPT・Claude・Geminiなどの違いを、目的と利用条件から比較します。料金や機能は変わることがあるため、利用前には各サービスの公式情報もあわせて確認してください。' },
]

// スラッグ → 表示名
export const slugToName: Record<string, string> = Object.fromEntries(
  categories.map(c => [c.slug, c.name])
)

// 表示名 → スラッグ
export const nameToSlug: Record<string, string> = Object.fromEntries(
  categories.map(c => [c.name, c.slug])
)

/** 表示名から安全にカテゴリページのパスを得る（未知の名前はトップへ） */
export function categoryHref(name: string): string {
  const slug = nameToSlug[name]
  return slug ? `/category/${slug}` : '/blog'
}
