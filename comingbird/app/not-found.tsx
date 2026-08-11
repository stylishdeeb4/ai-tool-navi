import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="cb-shell flex max-w-lg flex-col items-center py-24 text-center">
      <p className="text-5xl font-bold text-cb-accent">404</p>
      <h1 className="mt-4 text-xl font-bold">ページが見つかりません</h1>
      <p className="mt-2 text-sm leading-relaxed text-cb-muted">
        お探しのページは削除されたか、URL が変更された可能性があります。
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="cb-btn">新着を見る</Link>
        <Link href="/ranking" className="cb-btn-ghost">ランキングを見る</Link>
      </div>
    </div>
  )
}
