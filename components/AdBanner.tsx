'use client'
import { useEffect } from 'react'

interface Props {
  slot: string
  format?: 'auto' | 'rectangle' | 'horizontal'
  className?: string
}

// Google AdSense広告コンポーネント
// AdSenseアカウント取得後、NEXT_PUBLIC_ADSENSE_CLIENT_IDに設定してください
export default function AdBanner({ slot, format = 'auto', className = '' }: Props) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-8669480770000631'
  // slot は AdSense で広告ユニットを作成して得られる「数値ID」を指定する。
  // 仮の文字列（ARTICLE_TOP 等）のままでは広告は出せないため、本番では何も描画しない。
  const hasRealSlot = /^\d+$/.test(slot)

  useEffect(() => {
    if (clientId && hasRealSlot) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch {}
    }
  }, [clientId, hasRealSlot])

  if (!hasRealSlot) {
    // 実スロットID未設定。本番では非表示、開発時のみ目印を表示。
    if (process.env.NODE_ENV !== 'production') {
      return (
        <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm ${className}`}
          style={{ minHeight: format === 'horizontal' ? '90px' : '250px' }}>
          📢 広告枠（実スロットID設定後に表示）
        </div>
      )
    }
    return null
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
