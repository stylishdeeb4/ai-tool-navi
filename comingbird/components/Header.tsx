'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Logo from './Logo'
import SearchBox from './SearchBox'

const NAV = [
  { href: '/', label: '新着' },
  { href: '/ranking', label: 'ランキング' },
  { href: '/search', label: '検索' },
  { href: '/import', label: 'インポート' },
  { href: '/about', label: 'このサイトについて' },
]

export default function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <header className="sticky top-0 z-50 border-b border-cb-border bg-cb-bg/95 backdrop-blur">
      <div className="cb-shell">
        <div className="flex h-16 items-center gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Logo />
            <span className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight text-cb-text">Coming Bird</span>
              <span className="hidden rounded bg-cb-raised px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cb-accent sm:inline">
                Beta
              </span>
            </span>
          </Link>

          <nav className="ml-2 hidden flex-1 items-center gap-1 lg:flex">
            {NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  isActive(item.href)
                    ? 'bg-cb-raised font-semibold text-cb-accent'
                    : 'text-cb-muted hover:bg-cb-surface hover:text-cb-text'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden w-72 lg:block">
            <SearchBox />
          </div>

          <button
            type="button"
            className="ml-auto rounded-md p-2 text-cb-muted hover:bg-cb-surface hover:text-cb-text lg:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="メニュー"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div className="border-t border-cb-border py-3 lg:hidden">
            <div className="pb-3">
              <SearchBox />
            </div>
            <nav className="flex flex-col">
              {NAV.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm ${
                    isActive(item.href)
                      ? 'bg-cb-raised font-semibold text-cb-accent'
                      : 'text-cb-muted hover:bg-cb-surface hover:text-cb-text'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
