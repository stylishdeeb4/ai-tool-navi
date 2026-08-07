import { affiliates } from '@/lib/affiliates'

// トップページ用：実リンクが設定済みのアフィリ案件だけをカードで表示する。
// url未設定の案件は出さないので、提携が増えるほど自動で充実する。
interface Props {
  // 表示する案件を限定する。指定したキーだけを、この順序で出す。
  keys?: string[]
  // 先頭に出したい案件。指定外の「url済み」案件は、そのあとに設定順で続く。
  // （提携が増えたときに自動で載る挙動を保ったまま、並び順だけ制御したい場合に使う）
  priority?: string[]
  title?: string
  limit?: number
}

export default function AffiliatePicks({ keys, priority, title = '副業・ブログ開設におすすめのサービス', limit }: Props) {
  const all = Object.keys(affiliates)
  const order = keys && keys.length
    ? keys
    : priority && priority.length
      ? [...priority.filter(k => all.includes(k)), ...all.filter(k => !priority.includes(k))]
      : all
  let picks = order
    .map(k => ({ key: k, offer: affiliates[k] }))
    .filter(x => x.offer && x.offer.url)
  if (limit) picks = picks.slice(0, limit)

  if (picks.length === 0) return null

  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-gray-800 mb-1">{title}</h2>
      <p className="text-xs text-gray-400 mb-4">※当サイトはアフィリエイトプログラムを利用しています</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {picks.map(({ key, offer }) => (
          <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col">
            <div className="text-xs font-bold text-sky-500 tracking-wide mb-1">{offer.eyebrow}</div>
            <div className="text-base font-bold text-gray-900 mb-2">{offer.name}</div>
            <p className="text-sm text-gray-600 leading-relaxed flex-1">{offer.catch}</p>
            <a
              href={offer.url}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="mt-4 inline-block text-center bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-5 py-2.5 rounded-full transition-colors"
            >
              {offer.button} →
            </a>
            {offer.note && <div className="text-[11px] text-gray-400 mt-2">{offer.note}</div>}
          </div>
        ))}
      </div>
    </section>
  )
}
