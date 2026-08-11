import Link from 'next/link'
import SearchBox from '@/components/SearchBox'
import SectionHeading from '@/components/SectionHeading'
import VideoGrid from '@/components/VideoGrid'
import { getNewArrivals, getPopularTags, getRanking, getStats } from '@/lib/data'
import { formatCount } from '@/lib/format'

export default function HomePage() {
  const newArrivals = getNewArrivals(12)
  const topRanked = getRanking('daily', 4)
  const tags = getPopularTags(10)
  const stats = getStats()

  return (
    <div className="cb-shell py-8">
      <section className="cb-card mb-10 px-5 py-8 sm:px-8 sm:py-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-cb-accent">
          iMons 再生ランキング
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl">いま見られている動画が集まる場所</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cb-muted">
          iMons ユーザーの再生・ダウンロード・お気に入りを集計し、新着フィードとランキングに反映しています。
          X の URL を登録すると、新着・ランキング・検索から見つけやすくなります。
        </p>

        <div className="mt-6 max-w-xl">
          <SearchBox placeholder="動画・ユーザー名・タグで検索" />
        </div>

        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-cb-muted">登録動画</dt>
            <dd className="text-lg font-bold tabular-nums">{formatCount(stats.videos)}</dd>
          </div>
          <div>
            <dt className="text-cb-muted">累計再生</dt>
            <dd className="text-lg font-bold tabular-nums">{formatCount(stats.views)}</dd>
          </div>
          <div>
            <dt className="text-cb-muted">投稿者</dt>
            <dd className="text-lg font-bold tabular-nums">{formatCount(stats.creators)}</dd>
          </div>
        </dl>
      </section>

      <section className="mb-10">
        <SectionHeading
          title="日間ランキング"
          description="直近24時間の再生数が多い動画"
          moreHref="/ranking"
          moreLabel="ランキングを見る"
        />
        <VideoGrid videos={topRanked} ranked emptyMessage="集計対象の動画がまだありません。" />
      </section>

      <section className="mb-10">
        <SectionHeading title="新着" description="登録されたばかりの動画" />
        <VideoGrid videos={newArrivals} />
      </section>

      <section>
        <SectionHeading title="人気のタグ" />
        <div className="flex flex-wrap gap-2">
          {tags.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="cb-chip hover:border-cb-accent hover:text-cb-text"
            >
              #{tag}
              <span className="ml-1.5 tabular-nums text-cb-muted">{count}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
