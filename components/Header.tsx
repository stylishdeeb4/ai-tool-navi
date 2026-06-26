'use client'
import Link from 'next/link'
import { useState } from 'react'

const categories = [
  { name: 'ChatGPT', href: '/category/chatgpt' },
  { name: 'Claude', href: '/category/claude' },
  { name: '画像生成AI', href: '/category/image-ai' },
  { name: 'AI動画', href: '/category/video-ai' },
  { name: '副業・収益化', href: '/category/fukugyo' },
  { name: '比較・レビュー', href: '/category/review' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <div>
              <span className="text-lg font-bold text-blue-700">AIツールナビ</span>
              <span className="hidden sm:block text-xs text-gray-500">最新AIツールの使い方・比較サイト</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {categories.map(c => (
              <Link key={c.href} href={c.href}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                {c.name}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="メニュー">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden py-3 border-t border-gray-100">
            {categories.map(c => (
              <Link key={c.href} href={c.href}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
                onClick={() => setMenuOpen(false)}>
                {c.name}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
