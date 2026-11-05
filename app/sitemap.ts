import { getAllPosts } from '@/lib/posts'
import type { MetadataRoute } from 'next'
import { categories } from '@/lib/categories'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hukugyou.blog'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()
  const postUrls = posts.map(post => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated || post.date),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'daily', priority: 0.9 },
    ...categories.map(category => ({ url: `${SITE_URL}/category/${category.slug}`, changeFrequency: 'weekly' as const, priority: 0.7 })),
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/privacy-policy`, changeFrequency: 'monthly', priority: 0.3 },
    ...postUrls,
  ]
}
