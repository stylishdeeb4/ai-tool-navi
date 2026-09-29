import Link from 'next/link'
import type { Guide } from '@/lib/guides'
import type { PostMeta } from '@/lib/posts'

interface Props {
  guide: Guide
  index: number
  posts: Record<string, PostMeta>
}

// 記事末尾に表示する「ガイドの現在地」と次の記事への導線
export default function GuideNav({ guide, index, posts }: Props) {
  const steps = guide.steps.filter(step => posts[step.slug])
  const current = steps.findIndex(step => step.slug === guide.steps[index].slug)
  const next = steps[current + 1]

  return (
    <nav aria-label={`ガイド：${guide.title}`} className="mt-10 rounded-xl border border-blue-100 bg-blue-50 p-5 md:p-6">
      <p className="text-xs font-medium text-blue-700 mb-1">目的別ガイド（{current + 1}/{steps.length}）</p>
      <h2 className="text-lg font-bold text-gray-900 mb-4">{guide.title}</h2>
      <ol className="space-y-2 text-sm">
        {steps.map((step, i) => (
          <li key={step.slug} className="flex gap-3 items-baseline">
            <span className={`shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${i === current ? 'bg-blue-700 text-white' : 'bg-white text-blue-700 border border-blue-200'}`}>{i + 1}</span>
            {i === current
              ? <span className="font-semibold text-gray-900" aria-current="step">{step.label}（この記事）</span>
              : <Link href={`/blog/${step.slug}`} className="text-blue-700 underline underline-offset-4">{step.label}</Link>}
          </li>
        ))}
      </ol>
      {next && (
        <Link href={`/blog/${next.slug}`} className="mt-5 flex items-center justify-between gap-3 rounded-lg bg-blue-700 px-4 py-3 text-white hover:bg-blue-800 transition-colors">
          <span className="text-sm">
            <span className="block text-xs text-blue-100">次に読む</span>
            <span className="font-semibold">{posts[next.slug].title}</span>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </nav>
  )
}
