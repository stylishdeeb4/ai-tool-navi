import { getAllPosts } from '@/lib/posts'
import ArticleCard from '@/components/ArticleCard'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { slugToName, categories } from '@/lib/categories'

const categoryMap = slugToName

interface Props { params: { category: string } }

export async function generateStaticParams() {
  return categories.map(c => ({ category: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = categoryMap[params.category]
  if (!name) return {}
  return {
    title: `${name}の記事一覧`,
    description: `${name}に関する最新記事・使い方・比較情報をまとめています。`,
  }
}

export default function CategoryPage({ params }: Props) {
  const name = categoryMap[params.category]
  if (!name) notFound()

  const posts = getAllPosts().filter(p => p.category === name)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{name} の記事一覧</h1>
      <p className="text-gray-500 text-sm mb-8">{posts.length}件の記事</p>

      {posts.length === 0 ? (
        <p className="text-gray-400 text-center py-16">このカテゴリの記事はまだありません</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map(post => <ArticleCard key={post.slug} post={post} />)}
        </div>
      )}
    </div>
  )
}
