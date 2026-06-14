import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const categoryConfig: Record<string, { gradient: string; emoji: string; accent: string }> = {
  ChatGPT:    { gradient: 'linear-gradient(135deg, #10b981, #065f46)', emoji: '💬', accent: '#34d399' },
  Claude:     { gradient: 'linear-gradient(135deg, #f97316, #7c2d12)', emoji: '🤖', accent: '#fb923c' },
  '画像生成AI': { gradient: 'linear-gradient(135deg, #8b5cf6, #4c1d95)', emoji: '🎨', accent: '#a78bfa' },
  'AI動画':   { gradient: 'linear-gradient(135deg, #ef4444, #7f1d1d)', emoji: '🎬', accent: '#f87171' },
  '比較・レビュー': { gradient: 'linear-gradient(135deg, #3b82f6, #1e3a8a)', emoji: '⚡', accent: '#60a5fa' },
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || 'AIツールナビ'
  const category = searchParams.get('category') || 'AI'
  const config = categoryConfig[category] ?? {
    gradient: 'linear-gradient(135deg, #3b82f6, #1e3a8a)',
    emoji: '🤖',
    accent: '#60a5fa',
  }

  const shortTitle = title.length > 44 ? title.slice(0, 44) + '…' : title

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: config.gradient,
          padding: '56px 64px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 320, height: 320, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', display: 'flex',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'auto' }}>
          <span style={{ fontSize: 28 }}>🤖</span>
          <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
            AIツールナビ
          </span>
        </div>
        <div style={{ fontSize: 80, marginBottom: 24, display: 'flex' }}>
          {config.emoji}
        </div>
        <div style={{ display: 'flex', marginBottom: 20 }}>
          <span style={{
            fontSize: 18, fontWeight: 700, color: config.accent,
            background: 'rgba(255,255,255,0.15)',
            padding: '6px 18px', borderRadius: 24,
          }}>
            {category}
          </span>
        </div>
        <div style={{
          fontSize: 48, fontWeight: 800, color: 'white',
          lineHeight: 1.25, display: 'flex',
        }}>
          {shortTitle}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    }
  )
}
