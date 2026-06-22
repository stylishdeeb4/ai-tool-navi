import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">🤖 AIツールナビ</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              ChatGPT・Claude・Geminiなど最新AIツールの使い方、比較、料金情報をわかりやすく解説。AIを使いこなして生産性を上げましょう。
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">カテゴリ</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/category/chatgpt" className="hover:text-white transition-colors">ChatGPT</Link></li>
              <li><Link href="/category/claude" className="hover:text-white transition-colors">Claude</Link></li>
              <li><Link href="/category/image-ai" className="hover:text-white transition-colors">画像生成AI</Link></li>
              <li><Link href="/category/video-ai" className="hover:text-white transition-colors">AI動画</Link></li>
              <li><Link href="/category/review" className="hover:text-white transition-colors">比較・レビュー</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">サイト情報</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">このサイトについて</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">プライバシーポリシー</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">お問い合わせ</Link></li>
              <li><Link href="/sitemap.xml" className="hover:text-white transition-colors">サイトマップ</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-6 text-center text-sm text-gray-500">
          <p>当サイトはAmazonアソシエイト・Google AdSenseに参加しています。</p>
          <p className="mt-1">© {year} AIツールナビ All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}
