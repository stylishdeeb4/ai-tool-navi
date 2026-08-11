import VideoCard from './VideoCard'
import type { Video } from '@/lib/types'

export default function VideoGrid({
  videos,
  ranked = false,
  emptyMessage = '該当する動画がありません。',
}: {
  videos: Video[]
  /** true にするとカードに順位バッジを表示する */
  ranked?: boolean
  emptyMessage?: string
}) {
  if (videos.length === 0) {
    return (
      <p className="cb-card px-4 py-10 text-center text-sm text-cb-muted">{emptyMessage}</p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {videos.map((video, i) => (
        <VideoCard key={video.id} video={video} rank={ranked ? i + 1 : undefined} />
      ))}
    </div>
  )
}
