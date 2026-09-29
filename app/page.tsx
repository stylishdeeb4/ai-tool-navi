import { getAllPosts } from '@/lib/posts'
import { categories } from '@/lib/categories'
import ArticleCard from '@/components/ArticleCard'
import AdBanner from '@/components/AdBanner'
import GuideList from '@/components/GuideList'
import { guides } from '@/lib/guides'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  description: 'AIツールの比較から記事づくり、副業ブログの始め方まで。目的に合うツールの選び方と、最初の実践に必要な手順を紹介します。',
}

export default function Home() {
  const posts = getAllPosts()
  const postMap = Object.fromEntries(posts.map(post => [post.slug, post]))
  const featured = posts.find(post => post.slug === 'ai-blog-koukai-checklist') || posts[0]
  const recent = posts.filter(post => post.slug !== featured?.slug)
    .sort((a, b) => new Date(b.updated || b.date).getTime() - new Date(a.updated || a.date).getTime())
    .slice(0, 6)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <section className="rounded-2xl bg-blue-50 border border-blue-100 px-6 py-10 md:p-12 mb-10">
        <p className="text-sm font-medium text-blue-700 mb-4">AIで始める副業と、ツールの使い方</p>
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-snug mb-5">
          AIを選ぶ。使う。<br /><span className="text-blue-700">仕事に活かす。</span>
        </h1>
        <p className="text-gray-600 leading-8 max-w-xl">ツールの比較から、記事づくり、副業の始め方まで。<br className="hidden sm:block" />いま知りたいことから、次の一歩を見つけましょう。</p>
      </section>

      <section aria-labelledby="start-heading" className="mb-10">
        <h2 id="start-heading" className="text-xl text-gray-900 mb-2">目的から探す</h2>
        <p className="text-sm text-gray-600 mb-5">やりたいことに合わせて、上から順に読むと必要な準備がそろいます。</p>
        <GuideList guides={guides} posts={postMap} />
      </section>

      {featured && (
        <section className="mb-10" aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="text-xl text-gray-900 mb-5">記事づくりの次の一歩</h2>
          <ArticleCard post={featured} featured />
        </section>
      )}

      <section className="mb-10" aria-labelledby="category-heading">
        <h2 id="category-heading" className="text-xl text-gray-900 mb-5">カテゴリから探す</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map(category => (
            <Link key={category.slug} href={`/category/${category.slug}`} className="rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-400 transition-colors">
              <h3 className="text-sm text-gray-900 mb-2">{category.name}</h3>
              <p className="text-xs text-gray-600 leading-5">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <AdBanner slot="TOP_BANNER" format="horizontal" className="mb-8" />

      {recent.length > 0 && (
        <section className="mb-10" aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="text-xl text-gray-900 mb-5">新着・更新記事</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map(post => <ArticleCard key={post.slug} post={post} />)}
          </div>
          <div className="text-center mt-6">
            <Link href="/blog" className="inline-block px-6 py-3 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors">記事一覧を見る →</Link>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-blue-100 bg-blue-50 p-6 md:p-8 sm:flex items-center justify-between gap-6">
        <div>
          <h2 className="text-lg text-gray-900 mb-2">ブログを始めたい方へ</h2>
          <p className="text-sm text-gray-600 leading-7">テーマの決め方、必要な費用、サービスを選ぶ条件を確認しましょう。</p>
        </div>
        <Link href="/blog/ai-blog-fukugyo-hajimekata" className="inline-block shrink-0 mt-4 sm:mt-0 py-3 text-sm font-semibold text-blue-700 underline underline-offset-4">ブログの始め方を読む →</Link>
      </section>
      <AdBanner slot="BOTTOM_BANNER" format="rectangle" className="mt-8" />
    </div>
  )
}
