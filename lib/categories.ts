// カテゴリの単一情報源（スラッグ ⇔ 表示名）
// ナビ・カテゴリページ・記事バッジはすべてここを参照する。

export interface Category {
  slug: string
  name: string
}

export const categories: Category[] = [
  { slug: 'chatgpt', name: 'ChatGPT' },
  { slug: 'claude', name: 'Claude' },
  { slug: 'image-ai', name: '画像生成AI' },
  { slug: 'video-ai', name: 'AI動画' },
  { slug: 'fukugyo', name: '副業・収益化' },
  { slug: 'review', name: '比較・レビュー' },
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
