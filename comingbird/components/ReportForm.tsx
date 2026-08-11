'use client'

import { useState } from 'react'

const REASONS = [
  { value: 'copyright', label: '権利侵害（著作権・肖像権など）' },
  { value: 'inappropriate', label: '不適切なコンテンツ' },
  { value: 'wrong-metadata', label: 'タイトルや投稿者情報の誤り' },
  { value: 'other', label: 'その他' },
]

export default function ReportForm({ defaultVideoId = '' }: { defaultVideoId?: string }) {
  const [videoId, setVideoId] = useState(defaultVideoId)
  const [reason, setReason] = useState(REASONS[0].value)
  const [detail, setDetail] = useState('')
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <div role="status" className="cb-card border-cb-accent/50 px-5 py-6">
        <h2 className="font-bold text-cb-accent">通報を受け付けました（デモ表示）</h2>
        <p className="mt-2 text-sm leading-relaxed text-cb-muted">
          内容を確認のうえ対応します。送信処理はこのデモには含まれていないため、実際には送信されていません。
        </p>
        <button type="button" className="cb-btn-ghost mt-4" onClick={() => setSent(false)}>
          別の内容を報告する
        </button>
      </div>
    )
  }

  return (
    <form
      className="cb-card space-y-5 px-5 py-6"
      onSubmit={e => {
        e.preventDefault()
        // 送信先は未接続。フォームの挙動確認用に完了状態だけを表示する。
        setSent(true)
      }}
    >
      <div>
        <label htmlFor="report-video" className="mb-1.5 block text-sm font-semibold">
          対象の動画 ID <span className="font-normal text-cb-muted">(任意)</span>
        </label>
        <input
          id="report-video"
          value={videoId}
          onChange={e => setVideoId(e.target.value)}
          placeholder="v-1001"
          className="cb-field"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">通報の理由</legend>
        <div className="space-y-2">
          {REASONS.map(r => (
            <label key={r.value} className="flex items-center gap-2.5 text-sm text-cb-muted">
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="h-4 w-4 accent-cb-accent"
              />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="report-detail" className="mb-1.5 block text-sm font-semibold">
          詳細
        </label>
        <textarea
          id="report-detail"
          required
          rows={5}
          value={detail}
          onChange={e => setDetail(e.target.value)}
          placeholder="どの部分が問題かをできるだけ具体的にご記入ください。"
          className="cb-field resize-y"
        />
      </div>

      <button type="submit" className="cb-btn">
        送信する
      </button>
    </form>
  )
}
