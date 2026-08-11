import { SAMPLE_VIDEOS } from './sample-videos'
import { RANK_RANGES, type RankRange, type Video } from './types'

/**
 * データ取得層。今はサンプル配列を返すだけだが、
 * 実データ連携時はこの関数群の中身だけを差し替えれば各ページは無変更で済む。
 */

export function getAllVideos(): Video[] {
  return SAMPLE_VIDEOS
}

/** 新着順 */
export function getNewArrivals(limit?: number): Video[] {
  const sorted = [...SAMPLE_VIDEOS].sort((a, b) => a.postedHoursAgo - b.postedHoursAgo)
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
}

/** 指定期間内の再生数ランキング */
export function getRanking(range: RankRange, limit?: number): Video[] {
  const def = RANK_RANGES.find(r => r.key === range) ?? RANK_RANGES[0]
  const scoped =
    def.hours === null
      ? [...SAMPLE_VIDEOS]
      : SAMPLE_VIDEOS.filter(v => v.postedHoursAgo <= (def.hours as number))
  const sorted = scoped.sort((a, b) => b.views - a.views)
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
}

export function isRankRange(value: string | undefined): value is RankRange {
  return RANK_RANGES.some(r => r.key === value)
}

/** 本文・ユーザー名・タグの全文検索 */
export function searchVideos(query: string): Video[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const terms = q.split(/\s+/)
  return SAMPLE_VIDEOS.filter(v => {
    const haystack = [v.title, v.authorName, v.authorHandle, ...v.tags].join(' ').toLowerCase()
    return terms.every(t => haystack.includes(t))
  }).sort((a, b) => b.views - a.views)
}

export function getVideo(id: string): Video | undefined {
  return SAMPLE_VIDEOS.find(v => v.id === id)
}

/** 同じタグを持つ動画（自分自身は除く） */
export function getRelatedVideos(video: Video, limit = 6): Video[] {
  return SAMPLE_VIDEOS.filter(v => v.id !== video.id)
    .map(v => ({ video: v, score: v.tags.filter(t => video.tags.includes(t)).length }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || b.video.views - a.video.views)
    .slice(0, limit)
    .map(x => x.video)
}

/** 出現数の多い順のタグ一覧 */
export function getPopularTags(limit = 12): { tag: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const v of SAMPLE_VIDEOS) {
    for (const t of v.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'ja'))
    .slice(0, limit)
}

export function getStats(): { videos: number; views: number; creators: number } {
  return {
    videos: SAMPLE_VIDEOS.length,
    views: SAMPLE_VIDEOS.reduce((sum, v) => sum + v.views, 0),
    creators: new Set(SAMPLE_VIDEOS.map(v => v.authorHandle)).size,
  }
}
