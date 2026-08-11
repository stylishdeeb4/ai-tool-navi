import type { Metadata } from 'next'
import Link from 'next/link'
import SearchBox from '@/components/SearchBox'
import VideoGrid from '@/components/VideoGrid'
import { getPopularTags, searchVideos } from '@/lib/data'

export const metadata: Metadata = {
  title: '検索',
  description: '動画のタイトル・投稿者名・タグから検索できます。',
}

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = (searchParams.q ?? '').trim()
  const results = query ? searchVideos(query) : []
  const tags = getPopularTags(10)

  return (
    <div className="cb-shell py-8">
      <h1 className="text-2xl font-bold">検索</h1>
      <p className="mt-2 text-sm text-cb-muted">タイトル・投稿者名・タグをまとめて検索します。</p>

      <div className="mt-5 max-w-xl">
        <SearchBox defaultValue={query} autoFocus />
      </div>

      {query ? (
        <>
          <p className="mb-4 mt-6 text-sm text-cb-muted">
            「<span className="font-semibold text-cb-text">{query}</span>」の検索結果:{' '}
            <span className="tabular-nums">{results.length}</span> 件
          </p>
          <VideoGrid
            videos={results}
            emptyMessage="一致する動画が見つかりませんでした。別のキーワードでお試しください。"
          />
        </>
      ) : (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-cb-muted">人気のタグから探す</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map(({ tag }) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="cb-chip hover:border-cb-accent hover:text-cb-text"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
