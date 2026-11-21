import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import A8LinkManager from '@/components/A8LinkManager'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

const SITE_NAME = 'AIツールナビ'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hukugyou.blog'
const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-8669480770000631'
const SITE_TITLE = `${SITE_NAME} | AIの使い方・比較と副業ブログの始め方`
const SITE_DESCRIPTION = 'AIツールの選び方や使い方、記事づくりの確認手順、副業ブログの準備と運営を初心者向けに紹介します。'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ['AIツール', 'ChatGPT 使い方', 'Claude 使い方', '画像生成AI', 'AI比較', 'AIツール おすすめ'],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
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
        <A8LinkManager />
      </body>
    </html>
  )
}
