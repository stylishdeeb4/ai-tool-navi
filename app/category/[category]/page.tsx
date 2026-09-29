import { getAllPosts } from '@/lib/posts'
import ArticleCard from '@/components/ArticleCard'
import GuideList from '@/components/GuideList'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { categories } from '@/lib/categories'
import { guidesForCategory } from '@/lib/guides'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hukugyou.blog'

interface Props { params: { category: string } }

function findCategory(slug: string) {
  return categories.find(c => c.slug === slug)
}

export async function generateStaticParams() {
  return categories.map(c => ({ category: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = findCategory(params.category)
  if (!category) return {}
  return {
    alternates: { canonical: `/category/${category.slug}` },
    title: `${category.name}の記事一覧｜${category.description}`,
    description: category.intro,
  }
}

export default function CategoryPage({ params }: Props) {
  const category = findCategory(params.category)
  if (!category) notFound()

  const allPosts = getAllPosts()
  const postMap = Object.fromEntries(allPosts.map(p => [p.slug, p]))
  const posts = allPosts.filter(p => p.category === category.name)
  const pillar = postMap[category.pillar]
  const rest = posts.filter(p => p.slug !== pillar?.slug)
  const relatedGuides = guidesForCategory(category.slug)

  const url = `${SITE_URL}/category/${category.slug}`
  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name}の記事一覧`,
    description: category.intro,
    url,
    inLanguage: 'ja',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: posts.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/blog/${p.slug}`, name: p.title })),
    },
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: category.name, item: url },
    ],
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, '\\u003c') }} />

      <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1">
        <Link href="/" className="hover:text-blue-500">ホーム</Link>
        <span>/</span>
        <span className="text-gray-600">{category.name}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-3">{category.name}の記事一覧</h1>
      <p className="text-gray-600 text-sm leading-7 mb-8 max-w-3xl">{category.intro}</p>

      {pillar && (
        <section aria-labelledby="pillar-heading" className="mb-10">
          <h2 id="pillar-heading" className="text-lg font-bold text-gray-900 mb-4">まず読みたい記事</h2>
          <ArticleCard post={pillar} featured />
        </section>
      )}

      {relatedGuides.length > 0 && (
        <section aria-labelledby="guide-heading" className="mb-10">
          <h2 id="guide-heading" className="text-lg font-bold text-gray-900 mb-4">目的別ガイド</h2>
          <GuideList guides={relatedGuides} posts={postMap} />
        </section>
      )}

      <section aria-labelledby="list-heading">
        <h2 id="list-heading" className="text-lg font-bold text-gray-900 mb-1">すべての記事</h2>
        <p className="text-gray-500 text-sm mb-5">{posts.length}件の記事</p>
        {rest.length === 0 ? (
          <p className="text-gray-400 text-center py-10">このカテゴリのほかの記事は準備中です</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map(post => <ArticleCard key={post.slug} post={post} />)}
          </div>
        )}
      </section>
    </div>
  )
}
