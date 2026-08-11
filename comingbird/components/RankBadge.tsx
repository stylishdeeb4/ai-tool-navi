const MEDALS: Record<number, string> = {
  1: 'bg-cb-gold text-black',
  2: 'bg-cb-silver text-black',
  3: 'bg-cb-bronze text-black',
}

export default function RankBadge({ rank, className = '' }: { rank: number; className?: string }) {
  const tone = MEDALS[rank] ?? 'bg-cb-raised text-cb-muted'
  return (
    <span
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-sm font-bold tabular-nums ${tone} ${className}`}
      aria-label={`${rank}位`}
    >
      {rank}
    </span>
  )
}
