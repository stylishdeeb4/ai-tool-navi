import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'お問い合わせ | AIツールナビ',
  description: 'AIツールナビへのお問い合わせはこちらから。',
}

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">お問い合わせ</h1>
      <p className="text-gray-600 mb-8">
        当サイトへのご質問・ご意見・ご要望は、以下のメールアドレスよりお気軽にご連絡ください。
        通常2〜3営業日以内にご返信いたします。
      </p>

      <div className="bg-gray-50 rounded-xl p-8 mb-8">
        <h2 className="text-lg font-bold mb-4">お問い合わせ先</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 w-24 shrink-0">メール</span>
            <a href="mailto:ikaling14@gmail.com" className="text-blue-600 hover:underline">
              ikaling14@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 w-24 shrink-0">サイト名</span>
            <span>AIツールナビ</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 w-24 shrink-0">URL</span>
            <span>https://hukugyou.blog</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-3">お問い合わせの前に</h2>
        <ul className="text-gray-700 space-y-2 text-sm">
          <li>・記事の内容に関するご指摘は大歓迎です</li>
          <li>・掲載情報の誤りにお気づきの場合はご連絡ください</li>
          <li>・商業的なご提案はお断りする場合があります</li>
          <li>・お問い合わせ内容によっては返信できない場合があります</li>
        </ul>
      </div>
    </div>
  )
        }
