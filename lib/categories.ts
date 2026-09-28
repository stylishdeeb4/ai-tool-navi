// カテゴリの単一情報源（スラッグ ⇔ 表示名）
// ナビ・カテゴリページ・記事バッジはすべてここを参照する。

export interface Category {
  slug: string
  name: string
  description: string
}

export const categories: Category[] = [
  { slug: 'chatgpt', name: 'ChatGPT', description: '使い方・プロンプト・活用例' },
  { slug: 'claude', name: 'Claude', description: '文章作成と日々の作業に' },
  { slug: 'image-ai', name: '画像生成AI', description: '画像づくりの手順と選び方' },
  { slug: 'video-ai', name: 'AI動画', description: '動画づくりのツールと活用法' },
  { slug: 'fukugyo', name: '副業・収益化', description: '始める準備とブログ運営' },
  { slug: 'review', name: '比較・レビュー', description: '目的と利用条件から比較' },
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
