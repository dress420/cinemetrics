import { ExternalLink } from 'lucide-react'
import { PROVIDERS, formatValue, formatCount, normalize, tone } from '../lib/ratings'
import './RatingsBoard.css'

// Markenzeichen der Anbieter als schlichte Badges (Farben, keine Logos)
export function ProviderMark({ provider, value, size = 'md' }) {
  if (provider === 'lb') {
    return (
      <span className={`pm pm-lb pm-${size}`} aria-hidden="true">
        <i style={{ background: '#ff8000' }} /><i style={{ background: '#00e054' }} /><i style={{ background: '#40bcf4' }} />
      </span>
    )
  }
  if (provider === 'mc') {
    const t = value == null ? 'none' : value >= 61 ? 'high' : value >= 40 ? 'mid' : 'low'
    return <span className={`pm pm-mc pm-mc-${t} pm-${size}`} aria-hidden="true">MC</span>
  }
  const label = { imdb: 'IMDb', rt: 'RT', tmdb: 'TMDB' }[provider]
  return <span className={`pm pm-${provider} pm-${size}`} aria-hidden="true">{label}</span>
}

const scaleLabel = { imdb: '/10', rt: '', mc: '/100', lb: '/5', tmdb: '/10' }

function SummaryRing({ value }) {
  const r = 34
  const c = 2 * Math.PI * r
  const pct = value == null ? 0 : value / 100
  return (
    <div className={`rb-ring rb-tone-${tone(value)}`}>
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r={r} className="rb-ring-track" />
        <circle cx="40" cy="40" r={r} className="rb-ring-fill" strokeDasharray={`${c * pct} ${c}`} />
      </svg>
      <span className="rb-ring-value">{value == null ? '—' : Math.round(value)}</span>
    </div>
  )
}

export default function RatingsBoard({ ratings, variant = 'full' }) {
  const { scores, status, summary, links } = ratings

  if (variant === 'compact') {
    return (
      <div className="rb-chips">
        {summary.overall != null && (
          <span className={`rb-chip rb-chip-total rb-tone-${tone(summary.overall)}`} title="CineMetrics score (Ø of all sources)">
            <b>{Math.round(summary.overall)}</b><small>score</small>
          </span>
        )}
        {PROVIDERS.map(p => {
          const s = scores[p.key]
          if (status[p.key] !== 'loading' && !s) return null
          return (
            <span key={p.key} className="rb-chip" title={p.label}>
              <ProviderMark provider={p.key} value={s?.value} size="sm" />
              {status[p.key] === 'loading' ? <span className="rb-chip-skel" /> : <b>{formatValue(p.key, s.value)}</b>}
            </span>
          )
        })}
      </div>
    )
  }

  const anyLoading = Object.values(status).some(s => s === 'loading')

  return (
    <div className="rb">
      <div className="rb-summary">
        <SummaryRing value={summary.overall} />
        <div className="rb-summary-text">
          <div className="rb-summary-title">CineMetrics score</div>
          <div className="rb-summary-sub">
            {summary.count ? `Average of ${summary.count} source${summary.count > 1 ? 's' : ''}` : 'Collecting ratings…'}
            {anyLoading && summary.count > 0 && ' · loading more…'}
          </div>
          {(summary.critics != null || summary.audience != null) && (
            <div className="rb-split">
              {summary.critics != null && <span><em>Critics</em> {Math.round(summary.critics)}</span>}
              {summary.audience != null && <span><em>Audience</em> {Math.round(summary.audience)}</span>}
            </div>
          )}
          {summary.verdict && <div className="rb-verdict">{summary.verdict}</div>}
        </div>
      </div>

      <div className="rb-list">
        {PROVIDERS.map(p => {
          const s = scores[p.key]
          const st = status[p.key]
          const pct = normalize(p.key, s?.value)
          const count = formatCount(s?.count)
          return (
            <a key={p.key} className={`rb-row rb-tone-${tone(pct)}`} href={links[p.key]} target="_blank" rel="noreferrer">
              <ProviderMark provider={p.key} value={s?.value} />
              <span className="rb-name">
                {p.label}
                <small>
                  {st === 'loading' ? 'loading…'
                    : st === 'error' ? 'temporarily unavailable'
                    : !s ? 'no rating yet'
                    : count ? `${count} ${p.group === 'critics' ? 'reviews' : 'ratings'}`
                    : p.group === 'critics' ? 'critics' : 'audience'}
                </small>
              </span>
              <span className="rb-bar">
                {st === 'loading'
                  ? <span className="rb-bar-skel" />
                  : <span className="rb-bar-fill" style={{ width: `${pct ?? 0}%` }} />}
              </span>
              <span className="rb-value">
                {st === 'loading' ? <span className="rb-value-skel" /> : (
                  <>{formatValue(p.key, s?.value)}{s && <small>{scaleLabel[p.key]}</small>}</>
                )}
              </span>
              <ExternalLink size={13} className="rb-ext" />
            </a>
          )
        })}
      </div>
    </div>
  )
}
