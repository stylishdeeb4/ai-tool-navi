import { getAllPostSlugs, getPost, getAllPosts } from '@/lib/posts'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import ArticleCard from '@/components/ArticleCard'
import AdBanner from '@/components/AdBanner'
import { markdownToHtml } from '@/lib/markdown'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  return getAllPostSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost(params.slug)
  if (!post) return {}
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hukugyou.blog'
  const ogImage = post.image || `${SITE_URL}/api/og?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category)}`
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      url: `${SITE_URL}/blog/${post.slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
  }
}

export default async function ArticlePage({ params }: Props) {
  const post = getPost(params.slug)
  if (!post) notFound()

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hukugyou.blog'
  const coverImage = post.image || `/api/og?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category)}`

  const contentHtml = await markdownToHtml(post.content)
  const allPosts = getAllPosts()
  const related = allPosts
    .filter(p => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    image: post.image || `${SITE_URL}/api/og?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category)}`,
    author: { '@type': 'Organization', name: 'AIツールナビ' },
    publisher: { '@type': 'Organization', name: 'AIツールナビ' },
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="lg:flex gap-8">
        <article className="flex-1 min-w-0">
          <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1">
            <Link href="/" className="hover:text-blue-500">ホーム</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-blue-500">記事一覧</Link>
            <span>/</span>
            <span className="text-gray-600 truncate">{post.title}</span>
          </nav>

          <div className="mb-3">
            <Link href={`/category/${post.category}`}
              className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full hover:bg-blue-200 transition-colors">
              {post.category}
            </Link>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">{post.title}</h1>

          <div className="flex items-center gap-4 text-xs text-gray-400 mb-6 pb-4 border-b border-gray-100">
            <time>{new Date(post.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
            {post.readingTime && <span>読了時間：約{post.readingTime}分</span>}
          </div>

          <div className="mb-8 rounded-xl overflow-hidden shadow-sm">
            <img src={coverImage} alt={post.title} className="w-full h-64 object-cover" />
          </div>

          <AdBanner slot="ARTICLE_TOP" format="horizontal" className="mb-8" />

          <div className="prose-article" dangerouslySetInnerHTML={{ __html: contentHtml }} />

          {post.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">#{tag}</span>
                ))}
              </div>
            </div>
          )}

          <AdBanner slot="ARTICLE_BOTTOM" format="rectangle" className="mt-8" />
        </article>

        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="sticky top-20">
            <AdBanner slot="SIDEBAR" format="rectangle" className="mb-6" />
            {related.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 mb-3 text-sm">関連記事</h3>
                <div className="space-y-3">
                  {related.map(p => (
                    <Link key={p.slug} href={`/blog/${p.slug}`}
                      className="block bg-white rounded-lg border border-gray-100 p-3 hover:border-blue-200 hover:shadow-sm transition-all">
                      <p className="text-sm font-medium text-gray-800 hover:text-blue-600 line-clamp-2">{p.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(p.date).toLocaleDateString('ja-JP')}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-gray-800 mb-4">同じカテゴリの記事</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map(p => <ArticleCard key={p.slug} post={p} />)}
          </div>
        </section>
      )}
    </div>
  )
               }
