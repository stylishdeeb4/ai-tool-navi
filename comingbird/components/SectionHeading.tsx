import Link from 'next/link'
import type { ReactNode } from 'react'

export default function SectionHeading({
  title,
  description,
  moreHref,
  moreLabel = 'もっと見る',
}: {
  title: ReactNode
  description?: string
  moreHref?: string
  moreLabel?: string
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-cb-muted">{description}</p>}
      </div>
      {moreHref && (
        <Link href={moreHref} className="shrink-0 text-sm font-semibold text-cb-accent hover:underline">
          {moreLabel} →
        </Link>
      )}
    </div>
  )
}
