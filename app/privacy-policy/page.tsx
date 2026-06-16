import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プライバシーポリシー | AIツールナビ',
  description: 'AIツールナビのプライバシーポリシーページです。',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>

      <p className="text-gray-600 mb-8">最終更新日：2026年6月16日</p>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">1. 基本方針</h2>
        <p className="text-gray-700 leading-relaxed">
          AIツールナビ（以下「当サイト」）は、ユーザーの個人情報保護を重要な責務と認識し、
          個人情報の保護に関する法律をはじめとする関連法規を遵守します。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">2. 収集する情報</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          当サイトでは、以下の情報を収集する場合があります。
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>アクセスログ（IPアドレス、ブラウザ情報、参照元URLなど）</li>
          <li>Cookieによるアクセス情報</li>
          <li>お問い合わせフォームから送信された情報</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">3. Cookieの使用について</h2>
        <p className="text-gray-700 leading-relaxed">
          当サイトでは、サービス向上のためCookieを使用しています。
          Cookieはブラウザの設定から無効にすることができますが、
          一部のサービスが利用できなくなる場合があります。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">4. Google AdSenseについて</h2>
        <p className="text-gray-700 leading-relaxed">
          当サイトはGoogle AdSenseを使用しています。
          Googleはユーザーのサイト閲覧情報に基づいて広告を配信します。
          Googleによるクッキーの使用については、
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Googleのポリシー
          </a>
          をご参照ください。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">5. Googleアナリティクスについて</h2>
        <p className="text-gray-700 leading-relaxed">
          当サイトでは、アクセス解析のためGoogleアナリティクスを使用する場合があります。
          Googleアナリティクスはトラフィックデータの収集のためにCookieを使用しています。
          このデータは匿名で収集されており、個人を特定するものではありません。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">6. アフィリエイトについて</h2>
        <p className="text-gray-700 leading-relaxed">
          当サイトは、Amazon.co.jpをはじめとするアフィリエイトプログラムに参加しています。
          当サイトを経由して商品を購入された場合、紹介料を受け取ることがあります。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">7. 免責事項</h2>
        <p className="text-gray-700 leading-relaxed">
          当サイトの情報は、できる限り正確な情報を提供するよう努めていますが、
          その内容の正確性・安全性を保証するものではありません。
          当サイトの情報を利用することによって生じた損害については、
          一切の責任を負いかねます。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">8. プライバシーポリシーの変更</h2>
        <p className="text-gray-700 leading-relaxed">
          当サイトは、必要に応じて本プライバシーポリシーを変更することがあります。
          変更後のプライバシーポリシーは、当ページに掲載した時点から効力を生じるものとします。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">9. お問い合わせ</h2>
        <p className="text-gray-700 leading-relaxed">
          プライバシーポリシーに関するお問い合わせは、
          <a href="/contact" className="text-blue-600 hover:underline">お問い合わせページ</a>
          よりご連絡ください。
        </p>
      </section>
    </div>
  )
}
