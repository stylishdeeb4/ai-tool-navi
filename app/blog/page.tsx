import { getAllPosts } from '@/lib/posts'
import ArticleCard from '@/components/ArticleCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '記事一覧',
  description: 'AIツールナビの全記事一覧。ChatGPT・Claude・画像生成AIなど最新AIツールの使い方・比較記事をまとめています。',
}

export default function BlogIndex() {
  const posts = getAllPosts()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">記事一覧</h1>
      <p className="text-gray-500 text-sm mb-8">全{posts.length}件の記事</p>

      {posts.length === 0 ? (
        <p className="text-gray-400 text-center py-16">記事がありません</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map(post => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
