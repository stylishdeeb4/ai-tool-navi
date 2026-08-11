import Link from 'next/link'
import RankBadge from './RankBadge'
import Thumb from './Thumb'
import { formatCount, formatRelative } from '@/lib/format'
import type { Video } from '@/lib/types'

export default function VideoCard({ video, rank }: { video: Video; rank?: number }) {
  return (
    <article className="cb-card group overflow-hidden transition-colors hover:border-cb-accent">
      <Link href={`/video/${video.id}`} className="block">
        <div className="relative">
          <Thumb hue={video.thumbHue} durationSec={video.durationSec} />
          {rank !== undefined && <RankBadge rank={rank} className="absolute left-1.5 top-1.5 shadow" />}
        </div>
        <div className="p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-cb-text group-hover:text-cb-accent">
            {video.title}
          </h3>
          <p className="mt-1.5 truncate text-xs text-cb-muted">@{video.authorHandle}</p>
          <p className="mt-1 flex items-center gap-2 text-xs tabular-nums text-cb-muted">
            <span>{formatCount(video.views)} 再生</span>
            <span aria-hidden="true">·</span>
            <span>{formatRelative(video.postedHoursAgo)}</span>
          </p>
        </div>
      </Link>
    </article>
  )
}
