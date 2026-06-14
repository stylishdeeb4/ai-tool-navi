import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description: 'AIツールナビのプライバシーポリシーページです。',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>
      <div className="prose-article space-y-6 text-gray-700">
        <section>
          <h2>広告について</h2>
          <p>
            当サイトでは、Google AdSense を利用した広告を掲載しています。
            Google AdSense はユーザーの興味に応じた広告を配信するため、Cookie を使用することがあります。
            Cookie を無効にする方法や、Google AdSense に関する詳細は
            <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
              Google のポリシーと規約
            </a>
            をご確認ください。
          </p>
        </section>
        <section>
          <h2>アクセス解析ツールについて</h2>
          <p>
            当サイトでは、Google Analytics を使用してアクセス解析を行っています。
            Google Analytics は Cookie を使用してデータを収集しますが、個人を特定する情報は含まれません。
          </p>
        </section>
        <section>
          <h2>アフィリエイトについて</h2>
          <p>
            当サイトは、Amazon.co.jp を宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供することを目的に設定されたアフィリエイトプログラムである、Amazonアソシエイト・プログラムの参加者です。
          </p>
        </section>
        <section>
          <h2>免責事項</h2>
          <p>
            当サイトの情報は可能な限り正確に記載していますが、正確性・安全性を保証するものではありません。
            掲載情報の利用によって生じた損害については一切の責任を負いかねます。
          </p>
        </section>
        <section>
          <h2>著作権について</h2>
          <p>
            当サイトに掲載されているコンテンツの著作権は運営者に帰属します。
            無断転載・複製はお断りします。
          </p>
        </section>
        <p className="text-sm text-gray-400 mt-8">最終更新日：{new Date().toLocaleDateString('ja-JP')}</p>
      </div>
    </div>
  )
}
