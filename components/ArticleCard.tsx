import Link from 'next/link'
import type { PostMeta } from '@/lib/posts'

const categoryColors: Record<string, string> = {
  ChatGPT: 'bg-green-100 text-green-700',
  Claude: 'bg-orange-100 text-orange-700',
  '画像生成AI': 'bg-purple-100 text-purple-700',
  'AI動画': 'bg-red-100 text-red-700',
  '比較・レビュー': 'bg-blue-100 text-blue-700',
  AI: 'bg-blue-100 text-blue-700',
}

interface Props {
  post: PostMeta
  featured?: boolean
}

export default function ArticleCard({ post, featured = false }: Props) {
  const colorClass = categoryColors[post.category] || 'bg-gray-100 text-gray-700'

  const coverSrc = post.image
    ? post.image
    : `/api/og?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category)}`

  return (
    <article className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group ${featured ? 'md:flex' : ''}`}>
      <div className={`relative overflow-hidden ${featured ? 'md:w-64 md:flex-shrink-0 h-48 md:h-auto' : 'h-44'}`}>
        <img
          src={coverSrc}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
            {post.category}
          </span>
          <time className="text-xs text-gray-400">
            {new Date(post.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
          {post.readingTime && (
            <span className="text-xs text-gray-400">約{post.readingTime}分</span>
          )}
        </div>

        <h2 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug ${featured ? 'text-xl mb-3' : 'text-base mb-2'}`}>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>

        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{post.description}</p>

        <div className="mt-3 flex flex-wrap gap-1">
          {post.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">#{tag}</span>
          ))}
        </div>
      </div>
    </article>
  )
}
