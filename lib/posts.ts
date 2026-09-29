import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { estimateReadingTime } from './reading-time'
import { guidesForPost } from './guides'

const postsDirectory = path.join(process.cwd(), 'content/posts')

export interface PostMeta {
  slug: string
  title: string
  description: string
  date: string
  /** 大幅リライト時の更新日（任意）。公開日 date は変えずにこちらを更新する */
  updated?: string
  category: string
  tags: string[]
  image?: string
  /** 関連記事として優先表示するスラッグ（任意） */
  related?: string[]
  readingTime?: number
}

export interface Post extends PostMeta {
  content: string
}

export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) return []
  return fs.readdirSync(postsDirectory)
    .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
    .map(f => f.replace(/\.mdx?$/, ''))
}

export function getAllPosts(): PostMeta[] {
  const slugs = getAllPostSlugs()
  return slugs
    .map(slug => getPostMeta(slug))
    .filter(Boolean)
    .sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime()) as PostMeta[]
}

export function getPostMeta(slug: string): PostMeta | null {
  try {
    const mdxPath = path.join(postsDirectory, `${slug}.mdx`)
    const mdPath = path.join(postsDirectory, `${slug}.md`)
    const fullPath = fs.existsSync(mdxPath) ? mdxPath : mdPath
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    const readingTime = estimateReadingTime(content)
    return {
      slug,
      title: data.title || '',
      description: data.description || '',
      date: data.date || '',
      updated: data.updated,
      category: data.category || 'AI',
      tags: data.tags || [],
      image: data.image,
      related: data.related,
      readingTime,
    }
  } catch {
    return null
  }
}

export function getPost(slug: string): Post | null {
  try {
    const mdxPath = path.join(postsDirectory, `${slug}.mdx`)
    const mdPath = path.join(postsDirectory, `${slug}.md`)
    const fullPath = fs.existsSync(mdxPath) ? mdxPath : mdPath
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    const readingTime = estimateReadingTime(content)
    return {
      slug,
      title: data.title || '',
      description: data.description || '',
      date: data.date || '',
      updated: data.updated,
      category: data.category || 'AI',
      tags: data.tags || [],
      image: data.image,
      related: data.related,
      readingTime,
      content,
    }
  } catch {
    return null
  }
}

export function getPostsByCategory(category: string): PostMeta[] {
  return getAllPosts().filter(p => p.category === category)
}

/**
 * 関連記事を選ぶ。frontmatter の related を最優先し、
 * 次に同じガイド・共通タグ・同じカテゴリの順で重み付けする。
 * 記事が少ないカテゴリでも、他カテゴリの関連記事で埋まるようにする。
 */
export function getRelatedPosts(post: PostMeta, allPosts: PostMeta[], limit = 3): PostMeta[] {
  const guideSlugs = new Set(guidesForPost(post.slug).flatMap(({ guide }) => guide.steps.map(step => step.slug)))
  const tags = new Set(post.tags)
  return allPosts
    .filter(p => p.slug !== post.slug)
    .map(p => {
      let score = 0
      const pinned = post.related?.indexOf(p.slug) ?? -1
      if (pinned !== -1) score += 100 - pinned
      if (guideSlugs.has(p.slug)) score += 4
      if (p.category === post.category) score += 3
      score += p.tags.filter(tag => tags.has(tag)).length * 2
      return { p, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.p.updated || b.p.date).getTime() - new Date(a.p.updated || a.p.date).getTime())
    .slice(0, limit)
    .map(({ p }) => p)
}
