import { getAllPosts } from '@/lib/posts'
import ArticleCard from '@/components/ArticleCard'
import AdBanner from '@/components/AdBanner'
import AffiliatePicks from '@/components/AffiliatePicks'
import Link from 'next/link'

export default function Home() {
  const posts = getAllPosts()
  const featured = posts[0]
  const recent = posts.slice(1, 7)

  const categories = [
    { name: 'ChatGPT', icon: '💬', href: '/category/chatgpt', desc: '使い方・プロンプト・活用術' },
    { name: 'Claude', icon: '🤖', href: '/category/claude', desc: 'Anthropicの高性能AI' },
    { name: '画像生成AI', icon: '🎨', href: '/category/image-ai', desc: 'Midjourney・DALL-E・Stable Diffusion' },
    { name: 'AI動画', icon: '🎬', href: '/category/video-ai', desc: 'Sora・Runway・Kling' },
    { name: '比較・レビュー', icon: '⚖️', href: '/category/review', desc: 'AIツールを徹底比較' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Hero */}
      <div className="text-center py-10 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          最新AIツールの<span className="text-blue-600">使い方・比較</span>を<br className="sm:hidden" />わかりやすく解説
        </h1>
        <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto">
          ChatGPT・Claude・Gemini・Midjourney など人気AIツールの最新情報をお届けします
        </p>
      </div>

      {/* Ad - top */}
      <AdBanner slot="TOP_BANNER" format="horizontal" className="mb-8" />

      {/* Categories */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4">カテゴリから探す</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map(cat => (
            <Link key={cat.href} href={cat.href}
              className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="font-semibold text-sm text-gray-800 group-hover:text-blue-600">{cat.name}</div>
              <div className="text-xs text-gray-400 mt-1 hidden sm:block">{cat.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4">注目記事</h2>
          <ArticleCard post={featured} featured />
        </section>
      )}

      {/* Recent posts */}
      {recent.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4">新着記事</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map(post => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/blog" className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              記事一覧を見る →
            </Link>
          </div>
        </section>
      )}

      {/* Affiliate picks */}
      <AffiliatePicks />

      {/* Ad - bottom */}
      <AdBanner slot="BOTTOM_BANNER" format="rectangle" className="mt-8" />
    </div>
  )
}
