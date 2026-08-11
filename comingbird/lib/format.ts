/** 12345 -> "1.2万" / 980 -> "980" */
export function formatCount(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1).replace(/\.0$/, '')}億`
  if (n >= 10_000) return `${(n / 10_000).toFixed(1).replace(/\.0$/, '')}万`
  return n.toLocaleString('ja-JP')
}

/** 95 -> "1:35" */
export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** 経過時間の日本語表記 */
export function formatRelative(hoursAgo: number): string {
  if (hoursAgo < 1) return `${Math.max(1, Math.round(hoursAgo * 60))}分前`
  if (hoursAgo < 24) return `${Math.floor(hoursAgo)}時間前`
  const days = Math.floor(hoursAgo / 24)
  if (days < 30) return `${days}日前`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}ヶ月前`
  return `${Math.floor(months / 12)}年前`
}

/** postedHoursAgo から絶対時刻を導出する（datetime 属性用） */
export function toIsoFromHoursAgo(hoursAgo: number, now: number = Date.now()): string {
  return new Date(now - hoursAgo * 3600_000).toISOString()
}
