import './Logo.css'

// Bildmarke: Play-Symbol aus drei Balken — "Cine" (Play) + "Metrics" (Balken)
export function LogoMark({ size = 32, className = '' }) {
  return (
    <svg
      className={`logo-mark ${className}`}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="13" fill="var(--accent)" />
      <rect x="15.5" y="12" width="5.5" height="24" rx="2.5" fill="var(--bg)" />
      <rect x="23" y="16" width="5.5" height="16" rx="2.5" fill="var(--bg)" />
      <rect x="30.5" y="20" width="5.5" height="8" rx="2.5" fill="var(--bg)" />
    </svg>
  )
}

export default function Logo({ size = 28, showWordmark = true }) {
  return (
    <span className="logo" aria-label="CineMetrics">
      <LogoMark size={size} />
      {showWordmark && (
        <span className="logo-word">
          Cine<span className="logo-word-accent">Metrics</span>
        </span>
      )}
    </span>
  )
}
