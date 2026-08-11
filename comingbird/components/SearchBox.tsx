'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SearchBox({
  defaultValue = '',
  placeholder = '動画・ユーザー名で検索',
  autoFocus = false,
}: {
  defaultValue?: string
  placeholder?: string
  autoFocus?: boolean
}) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)

  return (
    <form
      role="search"
      className="flex w-full items-center gap-2"
      onSubmit={e => {
        e.preventDefault()
        const q = value.trim()
        router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
      }}
    >
      <div className="relative flex-1">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cb-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
        </svg>
        <input
          type="search"
          name="q"
          value={value}
          autoFocus={autoFocus}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label="動画を検索"
          className="cb-field pl-9"
        />
      </div>
      <button type="submit" className="cb-btn shrink-0">
        検索
      </button>
    </form>
  )
}
