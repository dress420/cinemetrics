import { useState, useEffect } from 'react'
import MiniCard from '../components/MiniCard'
import './Streaming.css'

const WATCHMODE_KEY = 'iyrAi3e0WTtDLeIF4ywyes6ySKfAVOjrhNTDiRJN'
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY

const SERVICES = [
  { id: 203, name: 'Netflix',      color: '#E50914', icon: '🔴' },
  { id: 26,  name: 'Prime Video',  color: '#00A8E1', icon: '🔵' },
  { id: 372, name: 'Disney+',      color: '#113CCF', icon: '🏰' },
  { id: 387, name: 'HBO Max',      color: '#B535F6', icon: '💜' },
  { id: 371, name: 'Apple TV+',    color: '#555555', icon: '🍎' },
  { id: 157, name: 'Hulu',         color: '#1CE783', icon: '🟢' },
  { id: 444, name: 'Paramount+',   color: '#0064FF', icon: '⛰️' },
  { id: 389, name: 'Peacock',      color: '#FDB927', icon: '🦚' },
  { id: 60,  name: 'MUBI',         color: '#001489', icon: '🎬' },
  { id: 250, name: 'Shudder',      color: '#E30000', icon: '👻' },
  { id: 366, name: 'Criterion',    color: '#000000', icon: '🎞️' },
  { id: 368, name: 'Tubi',         color: '#FA382F', icon: '📺' },
]

export default function StreamingFilter() {
  const [selected, setSelected] = useState([])
  const [films, setFilms] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState('')

  const toggle = (id) => { setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }

  const search = async (p = 1) => {
    if (selected.length === 0) return
    setLoading(true); setError(''); setPage(p)
    try {
      const res = await fetch(`https://api.watchmode.com/v1/list-titles/?apiKey=${WATCHMODE_KEY}&source_ids=${selected.join(',')}&types=movie&sort_by=popularity_desc&page=${p}&limit=40`)
      if (!res.ok) throw new Error(`Watchmode API error: ${res.status}`)
      const data = await res.json()
      setTotalPages(Math.min(data.total_pages || 1, 10))
      const enriched = []
      for (let i = 0; i < (data.titles || []).length; i += 4) {
        const batch = (data.titles || []).slice(i, i + 4)
        const results = await Promise.all(batch.map(async (t) => {
          try {
            const r = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(t.title)}&year=${t.year}`)
            const d = await r.json()
            const m = (d.results || [])[0]
            return { id: m?.id || t.id, tmdb_id: m?.id, title: t.title, year: t.year, poster_path: m?.poster_path, backdrop_path: m?.backdrop_path, vote_average: m?.vote_average, overview: m?.overview, media_type: 'movie' }
          } catch { return { id: t.id, title: t.title, release_year: t.year, poster_path: null, media_type: 'movie' } }
        }))
        enriched.push(...results)
        if (i + 4 < (data.titles || []).length) await new Promise(r => setTimeout(r, 250))
      }
      setFilms(enriched)
    } catch (e) { setError(e.message || 'Failed to load.'); setFilms([]) }
    setLoading(false)
  }

  useEffect(() => { if (selected.length > 0) search(1); else setFilms([]) }, [selected])
  const activeNames = selected.map(id => SERVICES.find(s => s.id === id)?.name).filter(Boolean)

  return (
    <div className="sf-page">
      <div className="sf-header">
        <div className="page-title">Streaming Filter</div>
        <div className="page-sub">Pick your services — see what's available right now.</div>
      </div>
      <div className="sf-services">
        {SERVICES.map(s => (
          <button key={s.id} className={`sf-service${selected.includes(s.id) ? ' active' : ''}`} onClick={() => toggle(s.id)}
            style={selected.includes(s.id) ? { borderColor: s.color, background: `${s.color}15` } : {}}>
            <span className="sf-service-icon">{s.icon}</span>
            <span className="sf-service-name">{s.name}</span>
          </button>
        ))}
      </div>
      {error && <div className="sf-error mono">{error}</div>}
      {loading && <div className="sf-loading mono">Searching {activeNames.join(' + ')}...</div>}
      {!loading && films.length > 0 && (
        <>
          <div className="sf-results-count mono">{films.length} films on {activeNames.join(', ')}</div>
          <div className="mc-grid">{films.map(f => <MiniCard key={f.id} film={f} />)}</div>
          {totalPages > 1 && (
            <div className="sf-pagination">
              <button className="btn-secondary" onClick={() => search(page - 1)} disabled={page <= 1}>← Prev</button>
              <span className="mono" style={{ color: 'var(--text4)', fontSize: 12 }}>Page {page}/{totalPages}</span>
              <button className="btn-secondary" onClick={() => search(page + 1)} disabled={page >= totalPages}>Next →</button>
            </div>
          )}
        </>
      )}
      {!loading && selected.length === 0 && <div className="sf-prompt"><div className="sf-prompt-icon">📡</div><div className="sf-prompt-text mono">Select streaming services above</div></div>}
    </div>
  )
}
