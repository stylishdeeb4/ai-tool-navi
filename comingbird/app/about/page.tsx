import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'このサイトについて',
  description: 'Coming Bird の仕組みと、扱っているデータについて。',
}

const FEATURES = [
  {
    title: '新着フィード',
    body: 'アプリ内のリアクションを集計し、登録されたばかりの動画を新着として並べます。',
  },
  {
    title: 'ランキング',
    body: '日間・週間・月間・総合の期間ごとに、再生数の多い動画を並べ替えて表示します。',
  },
  {
    title: '全文検索',
    body: '動画のタイトル、投稿者名、タグをまとめて検索できます。',
  },
  {
    title: 'X の URL からインポート',
    body: '投稿の URL を登録すると、新着・ランキング・検索から見つけやすくなります。',
  },
  {
    title: '通報',
    body: '権利侵害や不適切なコンテンツを、動画ページから直接報告できます。',
  },
]

export default function AboutPage() {
  return (
    <div className="cb-shell max-w-3xl py-8">
      <h1 className="text-2xl font-bold">このサイトについて</h1>
      <p className="mt-3 text-sm leading-relaxed text-cb-muted">
        Coming Bird は、iMons ユーザーの再生・ダウンロード・お気に入りをもとに、
        新しい動画や注目されている動画を見つけられるようにしたランキングサイトです。
        現在はベータ版で、外部サービスや運用状況によって一部の機能が使えないことがあります。
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-bold">できること</h2>
        <dl className="mt-4 space-y-4">
          {FEATURES.map(f => (
            <div key={f.title} className="cb-card px-4 py-3">
              <dt className="font-semibold">{f.title}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-cb-muted">{f.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">扱っているデータ</h2>
        <p className="mt-3 text-sm leading-relaxed text-cb-muted">
          共有されるのは個人を特定できない動画のメタデータのみで、匿名での統計協力の設定はいつでも変更できます。
          動画ファイルそのものは保持・配信しておらず、再生は引用元の投稿ページで行われます。
        </p>
        <p className="mt-3 text-sm leading-relaxed text-cb-muted">
          掲載内容に問題がある場合は
          <Link href="/report" className="mx-1 text-cb-accent hover:underline">通報フォーム</Link>
          からご連絡ください。
        </p>
      </section>
    </div>
  )
}
