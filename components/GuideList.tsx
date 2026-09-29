import Link from 'next/link'
import type { Guide } from '@/lib/guides'
import type { PostMeta } from '@/lib/posts'

interface Props {
  guides: Guide[]
  posts: Record<string, PostMeta>
}

// トップ・カテゴリページ用：目的別ガイドの一覧（各ガイドの手順を記事リンクで示す）
export default function GuideList({ guides, posts }: Props) {
  const visible = guides
    .map(guide => ({ guide, steps: guide.steps.filter(step => posts[step.slug]) }))
    .filter(entry => entry.steps.length > 1)
  if (visible.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {visible.map(({ guide, steps }) => (
        <section key={guide.id} className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-base font-bold text-gray-900 mb-1">{guide.title}</h3>
          <p className="text-xs text-gray-600 leading-5 mb-4">{guide.description}</p>
          <ol className="space-y-2 text-sm">
            {steps.map((step, i) => (
              <li key={step.slug} className="flex gap-3 items-baseline">
                <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">{i + 1}</span>
                <Link href={`/blog/${step.slug}`} className="text-gray-800 hover:text-blue-700 underline-offset-4 hover:underline">{step.label}</Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
