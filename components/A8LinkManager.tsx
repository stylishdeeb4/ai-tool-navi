'use client'
import Script from 'next/script'

// A8.net リンクマネージャー
// ページ内のリンクを、A8管理画面の設定(config_id)に基づき自動でアフィリエイトリンクに変換する。
// 外部スクリプトのロード完了後に a8linkmgr() を呼ぶことで初期化順を保証する。
export default function A8LinkManager() {
  return (
    <Script
      src="https://statics.a8.net/a8link/a8linkmgr.js"
      strategy="afterInteractive"
      onLoad={() => {
        try {
          // @ts-ignore - a8linkmgr は外部スクリプトが定義するグローバル関数
          window.a8linkmgr({ config_id: 'kb2X6zBpW6XpYu7zIemm' })
        } catch {}
      }}
    />
  )
}
