import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

const SITE_NAME = 'AIツールナビ'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-tool-navi.vercel.app'
const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

export const metadata: Metadata = {h
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | 最新AIツールの使い方・比較・レビュー`,
    template: `%s | ${SITE_NAME}`,
  },
  description: 'ChatGPT・Claude・Gemini・Midjourney など最新AIツールの使い方、料金、比較をわかりやすく解説。AIを使いこなして作業効率を劇的に上げましょう。',
  keywords: ['AIツール', 'ChatGPT 使い方', 'Claude 使い方', '画像生成AI', 'AI比較', 'AIツール おすすめ'],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | 最新AIツールの使い方・比較・レビュー`,
    description: 'ChatGPT・Claude・Geminiなど最新AIツールの使い方・料金・比較をわかりやすく解説。',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: 'ChatGPT・Claude・Geminiなど最新AIツールの使い方・料金・比較をわかりやすく解説。',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: { canonical: SITE_URL },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head><meta name="google-site-verification" content="wgdvmt549w0GBjuMigyXvLxHYnCaSZh2EhWxiB1QJrk" />
        {ADSENSE_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
