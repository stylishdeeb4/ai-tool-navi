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
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

  useEffect(() => {
    if (clientId) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch {}
    }
  }, [clientId])

  if (!clientId) {
    // 開発環境・AdSense未設定時のプレースホルダー
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm ${className}`}
        style={{ minHeight: format === 'horizontal' ? '90px' : '250px' }}>
        📢 広告スペース (AdSense設定後に表示)
      </div>
    )
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
