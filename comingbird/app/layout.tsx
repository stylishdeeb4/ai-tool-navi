import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const SITE_NAME = 'Coming Bird'
const SITE_DESCRIPTION =
  'iMons の再生・ダウンロード・お気に入りをもとに、注目されている動画を新着とランキングで見つけられるサイトです。'

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} - iMons再生ランキング`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: SITE_NAME,
    title: `${SITE_NAME} - iMons再生ランキング`,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
