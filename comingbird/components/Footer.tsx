import Link from 'next/link'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-cb-border bg-cb-surface">
      <div className="cb-shell py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Logo className="h-6 w-6" />
              <span className="font-bold">Coming Bird</span>
            </div>
            <p className="text-sm leading-relaxed text-cb-muted">
              iMons の再生・ダウンロード・お気に入りをもとに、注目されている動画を新着とランキングで見つけられるサイトです。現在ベータ版として運用しています。
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold">さがす</h2>
            <ul className="space-y-2 text-sm text-cb-muted">
              <li><Link href="/" className="hover:text-cb-text">新着</Link></li>
              <li><Link href="/ranking" className="hover:text-cb-text">ランキング</Link></li>
              <li><Link href="/search" className="hover:text-cb-text">検索</Link></li>
              <li><Link href="/import" className="hover:text-cb-text">X の URL からインポート</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold">サイト情報</h2>
            <ul className="space-y-2 text-sm text-cb-muted">
              <li><Link href="/about" className="hover:text-cb-text">このサイトについて</Link></li>
              <li><Link href="/report" className="hover:text-cb-text">権利侵害・不適切コンテンツの通報</Link></li>
              <li><Link href="/privacy" className="hover:text-cb-text">プライバシー</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-cb-border pt-6 text-xs leading-relaxed text-cb-muted">
          <p>
            掲載しているのは動画のメタデータと引用元へのリンクのみです。権利侵害や不適切な内容を見つけた場合は
            <Link href="/report" className="mx-1 text-cb-accent hover:underline">通報フォーム</Link>
            からご連絡ください。
          </p>
          <p className="mt-2">© Coming Bird</p>
        </div>
      </div>
    </footer>
  )
}
