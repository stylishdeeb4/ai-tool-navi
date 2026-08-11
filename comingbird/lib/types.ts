export type RankRange = 'daily' | 'weekly' | 'monthly' | 'all'

export interface RankRangeDef {
  key: RankRange
  label: string
  /** 集計対象とする期間（時間）。all は無制限 */
  hours: number | null
}

export const RANK_RANGES: RankRangeDef[] = [
  { key: 'daily', label: '日間', hours: 24 },
  { key: 'weekly', label: '週間', hours: 24 * 7 },
  { key: 'monthly', label: '月間', hours: 24 * 30 },
  { key: 'all', label: '総合', hours: null },
]

export interface Video {
  id: string
  title: string
  authorName: string
  /** @ を含まないハンドル */
  authorHandle: string
  durationSec: number
  views: number
  downloads: number
  favorites: number
  /** 投稿からの経過時間。表示時に現在時刻から postedAt を導出する */
  postedHoursAgo: number
  tags: string[]
  /** 引用元の投稿URL */
  sourceUrl: string
  /** サムネイルプレースホルダの色相 */
  thumbHue: number
}
