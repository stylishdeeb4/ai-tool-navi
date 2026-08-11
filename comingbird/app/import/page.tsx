import type { Metadata } from 'next'
import ImportForm from '@/components/ImportForm'

export const metadata: Metadata = {
  title: 'X の URL からインポート',
  description: 'X の投稿 URL を登録して、新着・ランキング・検索から見つけやすくします。',
}

export default function ImportPage() {
  return (
    <div className="cb-shell max-w-3xl py-8">
      <h1 className="text-2xl font-bold">X の URL からインポート</h1>
      <p className="mt-2 text-sm leading-relaxed text-cb-muted">
        投稿の URL を登録すると、その動画が新着・ランキング・検索から見つけやすくなります。
        登録できるのは公開されている投稿のみです。
      </p>

      <div className="mt-6">
        <ImportForm />
      </div>

      <section className="mt-10">
        <h2 className="text-base font-bold">登録前にご確認ください</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-cb-muted">
          <li>・ 保持するのは動画のメタデータと引用元リンクのみで、動画ファイルは配信しません。</li>
          <li>・ 権利者の許諾なく公開された動画や、権利を侵害する内容の登録はご遠慮ください。</li>
          <li>・ 削除・非公開になった投稿は、一覧から自動的に取り下げられます。</li>
        </ul>
      </section>
    </div>
  )
}
