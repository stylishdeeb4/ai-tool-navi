import type { Metadata } from 'next'
import Link from 'next/link'
import RankBadge from '@/components/RankBadge'
import Thumb from '@/components/Thumb'
import { getRanking, isRankRange } from '@/lib/data'
import { formatCount, formatRelative } from '@/lib/format'
import { RANK_RANGES } from '@/lib/types'

export const metadata: Metadata = {
  title: 'ランキング',
  description: 'iMons の再生数をもとにした日間・週間・月間・総合ランキング。',
}

export default function RankingPage({
  searchParams,
}: {
  searchParams: { range?: string }
}) {
  const range = isRankRange(searchParams.range) ? searchParams.range : 'daily'
  const videos = getRanking(range)
  const current = RANK_RANGES.find(r => r.key === range)

  return (
    <div className="cb-shell py-8">
      <h1 className="text-2xl font-bold">ランキング</h1>
      <p className="mt-2 text-sm text-cb-muted">
        iMons ユーザーの再生数を集計しています。集計は一定間隔で更新されます。
      </p>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="集計期間">
        {RANK_RANGES.map(r => (
          <Link
            key={r.key}
            href={`/ranking?range=${r.key}`}
            aria-current={r.key === range ? 'page' : undefined}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              r.key === range
                ? 'bg-cb-accent-strong text-white'
                : 'border border-cb-border bg-cb-raised text-cb-muted hover:border-cb-accent hover:text-cb-text'
            }`}
          >
            {r.label}
          </Link>
        ))}
      </nav>

      <ol className="mt-6 space-y-2">
        {videos.map((video, i) => (
          <li key={video.id}>
            <Link
              href={`/video/${video.id}`}
              className="cb-card group flex items-center gap-3 p-2.5 transition-colors hover:border-cb-accent sm:gap-4 sm:p-3"
            >
              <RankBadge rank={i + 1} />
              <Thumb
                hue={video.thumbHue}
                durationSec={video.durationSec}
                className="w-28 shrink-0 rounded-md sm:w-40"
              />
              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-cb-accent sm:text-base">
                  {video.title}
                </h2>
                <p className="mt-1 truncate text-xs text-cb-muted">@{video.authorHandle}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs tabular-nums text-cb-muted">
                  <span className="font-semibold text-cb-text">{formatCount(video.views)} 再生</span>
                  <span aria-hidden="true">·</span>
                  <span>DL {formatCount(video.downloads)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatRelative(video.postedHoursAgo)}</span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      {videos.length === 0 && (
        <p className="cb-card mt-6 px-4 py-10 text-center text-sm text-cb-muted">
          {current?.label}の集計対象になる動画がまだありません。
        </p>
      )}
    </div>
  )
}
