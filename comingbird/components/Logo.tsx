export default function Logo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label="Coming Bird" className={className}>
      <circle cx="16" cy="16" r="15" className="fill-cb-accent-strong" />
      <path
        d="M23.5 11.2c-.9.4-1.8.6-2.8.7a4.6 4.6 0 0 0-2-1.6 4.9 4.9 0 0 0-6.6 4.3c-3.2-.2-6-1.7-8-4.2-1 1.7-.5 3.9 1.1 5a4.4 4.4 0 0 1-2.1-.6c0 2 1.4 3.8 3.4 4.2-.6.2-1.3.2-1.9.1a4.5 4.5 0 0 0 4.2 3.1 9.3 9.3 0 0 1-6.6 1.8"
        className="fill-none stroke-white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(1.5 -1)"
      />
    </svg>
  )
}
