import type { CSSProperties } from 'react'
import { formatDuration } from '@/lib/format'

/**
 * サムネイル。実物の画像は保持せず、色相から生成したグラデーションを表示する。
 * 外部画像を一切読み込まないため、CSP や帯域の影響を受けない。
 */
export default function Thumb({
  hue,
  durationSec,
  className = '',
}: {
  hue: number
  durationSec: number
  className?: string
}) {
  const style = { '--thumb-h': String(hue) } as CSSProperties

  return (
    <div
      style={style}
      className={`cb-thumb relative flex aspect-video items-center justify-center overflow-hidden ${className}`}
    >
      <svg className="h-10 w-10 text-white/45" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.14-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
      </svg>
      <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
        {formatDuration(durationSec)}
      </span>
    </div>
  )
}
