import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SectionHeading from '@/components/SectionHeading'
import Thumb from '@/components/Thumb'
import VideoGrid from '@/components/VideoGrid'
import { getAllVideos, getRelatedVideos, getVideo } from '@/lib/data'
import { formatCount, formatRelative, toIsoFromHoursAgo } from '@/lib/format'

export function generateStaticParams() {
  return getAllVideos().map(v => ({ id: v.id }))
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const video = getVideo(params.id)
  if (!video) return { title: '動画が見つかりません' }
  return {
    title: video.title,
    description: `@${video.authorHandle} の動画。再生数 ${formatCount(video.views)}。`,
  }
}

export default function VideoPage({ params }: { params: { id: string } }) {
  const video = getVideo(params.id)
  if (!video) notFound()

  const related = getRelatedVideos(video)
  const stats = [
    { label: '再生', value: video.views },
    { label: 'ダウンロード', value: video.downloads },
    { label: 'お気に入り', value: video.favorites },
  ]

  return (
    <div className="cb-shell py-8">
      <nav className="mb-4 text-sm text-cb-muted" aria-label="パンくず">
        <Link href="/" className="hover:text-cb-text">新着</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-cb-text">動画</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="cb-card overflow-hidden">
            <Thumb hue={video.thumbHue} durationSec={video.durationSec} />
          </div>

          <h1 className="mt-5 text-xl font-bold leading-snug sm:text-2xl">{video.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-cb-muted">
            <span className="font-semibold text-cb-text">{video.authorName}</span>
            <Link
              href={`/search?q=${encodeURIComponent(video.authorHandle)}`}
              className="text-cb-accent hover:underline"
            >
              @{video.authorHandle}
            </Link>
            <span aria-hidden="true">·</span>
            <time dateTime={toIsoFromHoursAgo(video.postedHoursAgo)}>
              {formatRelative(video.postedHoursAgo)}
            </time>
          </div>

          <dl className="mt-5 grid grid-cols-3 gap-3">
            {stats.map(s => (
              <div key={s.label} className="cb-card px-3 py-3 text-center">
                <dt className="text-xs text-cb-muted">{s.label}</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums">{formatCount(s.value)}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            {video.tags.map(tag => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="cb-chip hover:border-cb-accent hover:text-cb-text"
              >
                #{tag}
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={video.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="cb-btn"
            >
              元の投稿を開く
            </a>
            <Link href={`/report?id=${encodeURIComponent(video.id)}`} className="cb-btn-ghost">
              この動画を通報する
            </Link>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-cb-muted">
            当サイトが保持しているのは動画のメタデータと引用元リンクのみで、動画ファイルそのものは配信していません。
            再生は元の投稿ページで行われます。
          </p>
        </div>

        <aside className="min-w-0">
          <h2 className="mb-3 text-sm font-semibold text-cb-muted">この動画の情報</h2>
          <dl className="cb-card divide-y divide-cb-border text-sm">
            <div className="flex justify-between gap-3 px-4 py-2.5">
              <dt className="text-cb-muted">ID</dt>
              <dd className="tabular-nums">{video.id}</dd>
            </div>
            <div className="flex justify-between gap-3 px-4 py-2.5">
              <dt className="text-cb-muted">長さ</dt>
              <dd className="tabular-nums">{video.durationSec} 秒</dd>
            </div>
            <div className="flex justify-between gap-3 px-4 py-2.5">
              <dt className="text-cb-muted">投稿</dt>
              <dd>{formatRelative(video.postedHoursAgo)}</dd>
            </div>
            <div className="flex justify-between gap-3 px-4 py-2.5">
              <dt className="text-cb-muted">引用元</dt>
              <dd>
                <a
                  href={video.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-cb-accent hover:underline"
                >
                  X の投稿
                </a>
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <SectionHeading title="関連する動画" />
          <VideoGrid videos={related} />
        </section>
      )}
    </div>
  )
}
