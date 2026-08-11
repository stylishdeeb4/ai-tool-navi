import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'プライバシー',
  description: 'Coming Bird が取得・共有するデータの扱いについて。',
}

const SECTIONS = [
  {
    heading: '取得する情報',
    body: '再生・ダウンロード・お気に入りといったアプリ内の操作を、個人を特定できない形の統計として取得します。氏名やメールアドレスなどの個人情報は取得していません。',
  },
  {
    heading: '利用目的',
    body: '取得した統計は、新着フィードとランキングの集計、および検索結果の並び替えにのみ利用します。',
  },
  {
    heading: '第三者への提供',
    body: '共有するのは個人を特定できない動画のメタデータに限られます。匿名での統計協力はいつでも設定から変更できます。',
  },
  {
    heading: '動画ファイルの扱い',
    body: '動画ファイルそのものは保持・配信していません。当サイトが保持しているのはメタデータと引用元へのリンクのみです。',
  },
]

export default function PrivacyPage() {
  return (
    <div className="cb-shell max-w-3xl py-8">
      <h1 className="text-2xl font-bold">プライバシー</h1>

      <div className="mt-6 space-y-6">
        {SECTIONS.map(s => (
          <section key={s.heading}>
            <h2 className="text-base font-bold">{s.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-cb-muted">{s.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-8 text-sm leading-relaxed text-cb-muted">
        ご不明な点や掲載内容についてのご連絡は
        <Link href="/report" className="mx-1 text-cb-accent hover:underline">通報フォーム</Link>
        よりお願いします。
      </p>
    </div>
  )
}
