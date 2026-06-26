import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const categoryConfig: Record<string, { color: string; bg: string; emoji: string; accent: string }> = {
  ChatGPT:          { color: '#10b981', bg: '#052e16', emoji: '💬', accent: '#34d399' },
  Claude:           { color: '#f97316', bg: '#1c0a00', emoji: '🤖', accent: '#fb923c' },
  '画像生成AI':     { color: '#a855f7', bg: '#1a0533', emoji: '🎨', accent: '#c084fc' },
  'AI動画':         { color: '#ef4444', bg: '#1c0505', emoji: '🎬', accent: '#f87171' },
  '比較・レビュー': { color: '#3b82f6', bg: '#020d1f', emoji: '⚡', accent: '#60a5fa' },
  '副業・収益化':   { color: '#10b981', bg: '#052e16', emoji: '💰', accent: '#34d399' },
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || 'AIツールナビ'
  const category = searchParams.get('category') || 'AI'
  const cfg = categoryConfig[category] ?? { color: '#3b82f6', bg: '#020d1f', emoji: '🤖', accent: '#60a5fa' }
  const shortTitle = title.length > 36 ? title.slice(0, 36) + '…' : title

  return new ImageResponse(
    (
      <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', background: cfg.bg, fontFamily:'sans-serif', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:6, background:`linear-gradient(90deg, ${cfg.color}, ${cfg.accent})`, display:'flex' }} />
        <div style={{ position:'absolute', inset:0, display:'flex', backgroundImage:`radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)`, backgroundSize:'40px 40px' }} />
        <div style={{ position:'absolute', top:-120, right:-80, width:480, height:480, borderRadius:'50%', background:`radial-gradient(circle, ${cfg.color}33 0%, transparent 70%)`, display:'flex' }} />
        <div style={{ display:'flex', flexDirection:'column', flex:1, padding:'56px 72px 48px', position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:8, background: cfg.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🤖</div>
              <span style={{ color:'rgba(255,255,255,0.7)', fontSize:20, fontWeight:600 }}>AIツールナビ</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:`${cfg.color}22`, border:`1px solid ${cfg.color}55`, borderRadius:100, padding:'8px 20px' }}>
              <span style={{ fontSize:18 }}>{cfg.emoji}</span>
              <span style={{ color: cfg.accent, fontSize:17, fontWeight:700 }}>{category}</span>
            </div>
          </div>
          <div style={{ fontSize: shortTitle.length > 24 ? 46 : 54, fontWeight:900, color:'white', lineHeight:1.2, letterSpacing:'-0.01em', display:'flex', marginTop:40 }}>
            {shortTitle}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginTop:36 }}>
            <div style={{ height:2, width:48, background: cfg.color, display:'flex' }} />
            <span style={{ color:'rgba(255,255,255,0.35)', fontSize:15, letterSpacing:'0.08em' }}>AI TOOL NAVI</span>
          </div>
        </div>
        <div style={{ height:64, display:'flex', alignItems:'center', padding:'0 72px', background:`${cfg.color}18`, borderTop:`1px solid ${cfg.color}30` }}>
          <span style={{ color: cfg.accent, fontSize:15, fontWeight:600, opacity:0.8 }}>hukugyou.blog</span>
        </div>
      </div>
    ),
    { width:1200, height:630, headers:{ 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } }
  )
    }
