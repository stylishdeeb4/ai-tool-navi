// 目的別ガイド（読者の行動順に並べた記事の道筋）の単一情報源。
// トップページ・カテゴリページ・記事末尾の「次に読む」はすべてここを参照する。
// 記事を追加したら、該当するガイドの steps に入れると内部リンクが自動でつながる。

export interface GuideStep {
  slug: string
  /** ガイド内での短い呼び名（記事タイトルとは別） */
  label: string
}

export interface Guide {
  id: string
  title: string
  description: string
  /** 関連が強いカテゴリのスラッグ（カテゴリページでの表示に使う） */
  categories: string[]
  steps: GuideStep[]
}

export const guides: Guide[] = [
  {
    id: 'fukugyo-start',
    title: 'AI副業を安全に始める',
    description: '怪しい案件を避け、自分に合う副業を選び、税金まで確認する',
    categories: ['fukugyo', 'chatgpt'],
    steps: [
      { slug: 'ai-fukugyo-ayashii-anzen', label: '危険な副業を見分ける' },
      { slug: 'ai-fukugyo-osusume-15', label: '自分に合う副業を選ぶ' },
      { slug: 'chatgpt-fukugyo-hajimekata', label: 'ChatGPTで始める手順' },
      { slug: 'ai-fukugyo-kakutei-shinkoku', label: '税金と確定申告を確認する' },
    ],
  },
  {
    id: 'blog',
    title: 'AIでブログを育てる',
    description: '開設の準備から、記事の品質確認、画像づくり、収益化まで',
    categories: ['fukugyo', 'image-ai'],
    steps: [
      { slug: 'ai-blog-fukugyo-hajimekata', label: 'ブログを開設する' },
      { slug: 'ai-blog-koukai-checklist', label: '記事を公開前に確認する' },
      { slug: 'gazou-seisei-ai-prompt-kakikata', label: 'アイキャッチ画像を作る' },
      { slug: 'ai-gazou-chosakuken-shoyo', label: '画像の権利と規約を確認する' },
      { slug: 'ai-affiliate-marketing-2025', label: 'アフィリエイトで収益化する' },
    ],
  },
  {
    id: 'writing',
    title: 'AIライティングで稼ぐ',
    description: '案件の獲得から単価アップ、税金の手続きまで',
    categories: ['fukugyo', 'chatgpt'],
    steps: [
      { slug: 'chatgpt-writer-fukugyo-2025', label: 'ライター副業を始める' },
      { slug: 'chatgpt-prompt-engineering-guide', label: '指示文の質を上げる' },
      { slug: 'ai-writing-tanka-up', label: '文字単価を上げる' },
      { slug: 'ai-fukugyo-kakutei-shinkoku', label: '税金と確定申告を確認する' },
    ],
  },
  {
    id: 'image',
    title: '画像生成AIを使いこなす',
    description: 'ツール選びから、思いどおりに作るコツ、権利の確認まで',
    categories: ['image-ai', 'video-ai'],
    steps: [
      { slug: 'gazou-seisei-ai-osusume', label: 'ツールを選ぶ' },
      { slug: 'gazou-seisei-ai-prompt-kakikata', label: 'プロンプトを書く' },
      { slug: 'ai-gazou-chosakuken-shoyo', label: '著作権と商用利用を確認する' },
      { slug: 'ai-douga-seisei-tool', label: '動画づくりに広げる' },
    ],
  },
  {
    id: 'tool',
    title: '自分に合うAIを選ぶ',
    description: '目的別の比較から、基本の使い方、上手な指示の出し方まで',
    categories: ['review', 'chatgpt', 'claude'],
    steps: [
      { slug: 'ai-tool-osusume-2026', label: '目的別に比較する' },
      { slug: 'claude-vs-chatgpt-hikaku-2025', label: 'ChatGPTとClaudeを比べる' },
      { slug: 'chatgpt-tsukaikata-kanzen-guide', label: 'ChatGPTの基本を覚える' },
      { slug: 'claude-tsukaikata-guide', label: 'Claudeの基本を覚える' },
      { slug: 'chatgpt-prompt-engineering-guide', label: '指示の出し方を身につける' },
    ],
  },
]

/** 記事が含まれるガイドと、その中での位置を返す */
export function guidesForPost(slug: string): { guide: Guide; index: number }[] {
  return guides
    .map(guide => ({ guide, index: guide.steps.findIndex(step => step.slug === slug) }))
    .filter(entry => entry.index !== -1)
}

export function guidesForCategory(categorySlug: string): Guide[] {
  return guides.filter(guide => guide.categories.includes(categorySlug))
}
