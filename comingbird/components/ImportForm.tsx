'use client'

import { useState } from 'react'

/** x.com / twitter.com の投稿URLかどうかを形だけ確認する */
function parsePostUrl(input: string): { handle: string; statusId: string } | null {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:') return null
  const host = url.hostname.replace(/^www\./, '')
  if (host !== 'x.com' && host !== 'twitter.com') return null

  const m = url.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/)
  return m ? { handle: m[1], statusId: m[2] } : null
}

type State =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | { kind: 'queued'; handle: string; statusId: string }

export default function ImportForm() {
  const [url, setUrl] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })

  return (
    <div>
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={e => {
          e.preventDefault()
          const parsed = parsePostUrl(url)
          if (!parsed) {
            setState({
              kind: 'error',
              message: 'https://x.com/ユーザー名/status/... の形式の URL を入力してください。',
            })
            return
          }
          // 取り込み処理そのものは未実装。ここでは入力の検証結果のみを表示する。
          setState({ kind: 'queued', ...parsed })
          setUrl('')
        }}
      >
        <input
          type="url"
          value={url}
          onChange={e => {
            setUrl(e.target.value)
            if (state.kind === 'error') setState({ kind: 'idle' })
          }}
          placeholder="https://x.com/username/status/1234567890"
          aria-label="X の投稿 URL"
          aria-invalid={state.kind === 'error'}
          className="cb-field sm:flex-1"
        />
        <button type="submit" className="cb-btn shrink-0">
          登録する
        </button>
      </form>

      {state.kind === 'error' && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {state.message}
        </p>
      )}

      {state.kind === 'queued' && (
        <div role="status" className="cb-card mt-4 border-cb-accent/50 px-4 py-3 text-sm">
          <p className="font-semibold text-cb-accent">受付キューに追加しました（デモ表示）</p>
          <p className="mt-1 text-cb-muted">
            @{state.handle} の投稿 {state.statusId} を受け付けました。
            実際の取り込み処理はこのデモには含まれていません。
          </p>
        </div>
      )}
    </div>
  )
}
