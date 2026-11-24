import { useEffect, useState } from 'react'
import { getWatchProviders, IMG_LOGO } from '../lib/tmdb'
import { REGIONS, getRegion, saveRegion, groupOffers } from '../lib/watch'
import './WhereToWatch.css'

// Antworten pro Titel merken — alle Regionen stecken in einer Antwort
const cache = new Map()

/** Zeigt, wo ein Film / eine Serie legal läuft: kostenlos, im Abo, zum Leihen oder Kaufen. */
export default function WhereToWatch({ id, type = 'movie' }) {
  const [region, setRegion] = useState(getRegion)
  const [state, setState] = useState({ status: 'loading', results: null })
  const key = `${type}:${id}`

  useEffect(() => {
    if (!id) return
    if (cache.has(key)) { setState({ status: 'done', results: cache.get(key) }); return }
    let alive = true
    setState({ status: 'loading', results: null })
    getWatchProviders(id, type)
      .then(d => {
        if (!d?.results) throw new Error('no results')
        cache.set(key, d.results)
        if (alive) setState({ status: 'done', results: d.results })
      })
      .catch(() => { if (alive) setState({ status: 'error', results: null }) })
    return () => { alive = false }
  }, [key])

  const changeRegion = (r) => { setRegion(r); saveRegion(r) }

  const entry = state.results?.[region]
  const groups = groupOffers(entry)
  const regionLabel = REGIONS.find(r => r.code === region)?.label || region
  const elsewhere = state.status === 'done' && groups.length === 0
    ? REGIONS.filter(r => r.code !== region && groupOffers(state.results[r.code]).length > 0)
    : []
  const Chip = entry?.link ? 'a' : 'div'
  const chipProps = entry?.link ? { href: entry.link, target: '_blank', rel: 'noreferrer' } : {}

  return (
    <div className="fdp-section wtw">
      <div className="wtw-head">
        <div className="fdp-section-title">Where to watch</div>
        <div className="wtw-regions" role="group" aria-label="Region">
          {REGIONS.map(r => (
            <button
              key={r.code}
              className={`wtw-region${region === r.code ? ' active' : ''}`}
              onClick={() => changeRegion(r.code)}
              aria-pressed={region === r.code}
              title={r.label}
            >{r.code}</button>
          ))}
        </div>
      </div>

      {state.status === 'loading' && (
        <div className="wtw-skeleton" aria-label="Loading streaming info">
          {[0, 1, 2].map(i => <span key={i} />)}
        </div>
      )}

      {state.status === 'error' && <div className="fdp-note">Couldn't load streaming info right now.</div>}

      {state.status === 'done' && groups.length === 0 && (
        <div className="wtw-empty">
          Not available to stream, rent or buy in {regionLabel} right now.
          {elsewhere.length > 0 && (
            <span className="wtw-elsewhere">
              {' '}Available in{' '}
              {elsewhere.map((r, i) => (
                <span key={r.code}>
                  {i > 0 && ', '}
                  <button className="wtw-inline" onClick={() => changeRegion(r.code)}>{r.label}</button>
                </span>
              ))}.
            </span>
          )}
        </div>
      )}

      {groups.length > 0 && (
        <div className="wtw-groups">
          {groups.map(g => (
            <div key={g.key} className="wtw-group">
              <div className={`wtw-label wtw-label-${g.key}`}>{g.label}</div>
              <div className="wtw-providers">
                {g.providers.map(p => (
                  <Chip key={p.provider_id} className="wtw-provider" title={`${g.label} on ${p.provider_name}`} {...chipProps}>
                    {p.logo_path
                      ? <img src={`${IMG_LOGO}${p.logo_path}`} alt="" loading="lazy" />
                      : <span className="wtw-provider-fallback">{p.provider_name?.charAt(0)}</span>}
                    <span className="wtw-provider-name">{p.provider_name}</span>
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {state.status === 'done' && (
        <a className="wtw-credit" href="https://www.justwatch.com" target="_blank" rel="noreferrer">Data by JustWatch</a>
      )}
    </div>
  )
}
