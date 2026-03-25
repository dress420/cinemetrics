import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { IMG_THUMB } from '../lib/tmdb'
import './Dashboard.css'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE    = 'https://api.themoviedb.org/3'

const SOURCES = [
  { key: 'tmdb',         label: 'TMDB',            color: '#01b4e4' },
  { key: 'imdb',         label: 'IMDb',             color: '#f5c518' },
  { key: 'rottentomato', label: 'Rotten Tomatoes',  color: '#fa320a' },
  { key: 'metacritic',   label: 'Metacritic',       color: '#ffcc34' },
  { key: 'letterboxd',   label: 'Letterboxd',       color: '#00c030' },
  { key: 'nowplaying',   label: 'In Cinemas',       color: '#a855f7' },
]

const TIME_FILTERS = [
  { key: 'alltime', label: 'All Time'   },
  { key: 'year',    label: 'This Year'  },
  { key: 'month',   label: 'This Month' },
  { key: 'week',    label: 'This Week'  },
  { key: 'day',     label: 'Today'      },
]

const RUNTIME_FILTERS = [
  { key: 'any',    label: 'Any Length',   lte: null, gte: null },
  { key: 'short',  label: 'Under 90min', lte: 90,   gte: null },
  { key: 'medium', label: '90–120min',   lte: 120,  gte: 90 },
  { key: 'epic',   label: '2h+ Epic',    lte: null,  gte: 120 },
]

function getDateRange(timeFilter) {
  const now   = new Date()
  const yyyy  = now.getFullYear()
  const mm    = String(now.getMonth() + 1).padStart(2, '0')
  const dd    = String(now.getDate()).padStart(2, '0')
  const today = `${yyyy}-${mm}-${dd}`
  const daysAgo = (n) => {
    const d = new Date(now); d.setDate(d.getDate() - n)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }
  switch (timeFilter) {
    case 'day':   return { gte: daysAgo(1),        lte: today }
    case 'week':  return { gte: daysAgo(7),         lte: today }
    case 'month': return { gte: `${yyyy}-${mm}-01`, lte: today }
    case 'year':  return { gte: `${yyyy}-01-01`,    lte: today }
    default:      return null
  }
}

function buildUrl(source, timeFilter, page, runtimeFilter) {
  const range = getDateRange(timeFilter)
  const dateParam = range
    ? `&primary_release_date.gte=${range.gte}&primary_release_date.lte=${range.lte}`
    : ''
  const rtf = RUNTIME_FILTERS.find(r => r.key === runtimeFilter) || RUNTIME_FILTERS[0]
  const runtimeParam = (rtf.lte ? `&with_runtime.lte=${rtf.lte}` : '') + (rtf.gte ? `&with_runtime.gte=${rtf.gte}` : '')
  const q = `?api_key=${API_KEY}&language=en-US&page=${page}`

  switch (source) {
    case 'tmdb':
      if (timeFilter === 'alltime' || timeFilter === 'week')
        return `${BASE}/trending/all/week${q}`
      if (timeFilter === 'day')
        return `${BASE}/trending/all/day${q}`
      return `${BASE}/discover/movie${q}&sort_by=popularity.desc&vote_count.gte=10${dateParam}${runtimeParam}`

    case 'imdb':
      if (timeFilter === 'alltime')
        return `${BASE}/discover/movie${q}&sort_by=vote_average.desc&vote_count.gte=5000${runtimeParam}`
      return `${BASE}/discover/movie${q}&sort_by=vote_average.desc&vote_count.gte=100${dateParam}${runtimeParam}`

    case 'rottentomato':
      if (timeFilter === 'alltime')
        return `${BASE}/discover/movie${q}&sort_by=popularity.desc&vote_count.gte=2000${runtimeParam}`
      return `${BASE}/discover/movie${q}&sort_by=popularity.desc&vote_count.gte=5${dateParam}${runtimeParam}`

    case 'metacritic':
      if (timeFilter === 'alltime')
        return `${BASE}/discover/movie${q}&sort_by=vote_average.desc&vote_count.gte=1000${runtimeParam}`
      return `${BASE}/discover/movie${q}&sort_by=vote_average.desc&vote_count.gte=10${dateParam}${runtimeParam}`

    case 'letterboxd':
      if (timeFilter === 'alltime')
        return `${BASE}/discover/movie${q}&sort_by=vote_average.desc&vote_count.gte=200&with_original_language=en${runtimeParam}`
      return `${BASE}/discover/movie${q}&sort_by=vote_average.desc&vote_count.gte=5&with_original_language=en${dateParam}${runtimeParam}`

    case 'nowplaying':
      return `${BASE}/movie/now_playing${q}`

    default:
      return `${BASE}/trending/all/week${q}`
  }
}

export default function Dashboard({ onAddFilm, refreshKey, onFilmClick }) {
  const [stats,      setStats]          = useState({ total: 0, watchtime: 0, avgRating: 0, gems: 0 })
  const [items,      setItems]          = useState([])
  const [featured,   setFeatured]       = useState(null)
  const [source,     setSource]         = useState('tmdb')
  const [timeFilter, setTimeFilter]     = useState('week')
  const [runtimeFilter, setRuntimeFilter] = useState('any')
  const [page,       setPage]           = useState(1)
  const [totalPages, setTotalPages]     = useState(1)
  const [loading,    setLoading]        = useState(false)
  const [noResults,  setNoResults]      = useState(false)
  const fetchId = useRef(0)

  useEffect(() => { loadStats() }, [refreshKey])

  useEffect(() => {
    const id = ++fetchId.current
    setLoading(true)
    setNoResults(false)
    fetch(buildUrl(source, timeFilter, page, runtimeFilter))
      .then(r => r.json())
      .then(data => {
        if (id !== fetchId.current) return
        const results = (data.results || []).filter(r => r.poster_path)
        setTotalPages(Math.min(data.total_pages || 1, 50))
        setItems(results)
        setFeatured(results[0] || null)
        setNoResults(results.length === 0)
        setLoading(false)
      })
      .catch(() => { if (id !== fetchId.current) return; setItems([]); setNoResults(true); setLoading(false) })
  }, [source, timeFilter, page, runtimeFilter])

  const loadStats = async () => {
    const { data } = await supabase.from('films').select('runtime, user_rating, vote_average')
    if (!data) return
    const total     = data.length
    const watchtime = Math.round(data.reduce((s, f) => s + (f.runtime || 100), 0) / 60)
    const rated     = data.filter(f => f.user_rating)
    const avgRating = rated.length ? (rated.reduce((s, f) => s + f.user_rating, 0) / rated.length).toFixed(1) : 0
    const gems      = data.filter(f => f.vote_average && f.vote_average < 7.5 && f.user_rating >= 8).length
    setStats({ total, watchtime, avgRating, gems })
  }

  const changeSource  = (s) => { if (s === source) return; setPage(1); setSource(s) }
  const changeTime    = (t) => { if (t === timeFilter) return; setPage(1); setTimeFilter(t) }
  const changeRuntime = (r) => { if (r === runtimeFilter) return; setPage(1); setRuntimeFilter(r) }
  const goToPage      = (p) => { if (p < 1 || p > totalPages || p === page) return; setPage(p) }

  const src  = SOURCES.find(s => s.key === source)
  const days = Math.round(stats.watchtime / 24)
  const rank = (i) => (page - 1) * 20 + i + 1
  const showTimeFilter = source !== 'nowplaying'

  const pageButtons = () => {
    let start = Math.max(1, page - 2)
    let end   = Math.min(totalPages, start + 4)
    if (end - start < 4) start = Math.max(1, end - 4)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  return (
    <div className="dashboard">
      <div className="dashboard-inner">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Films logged</div>
            <div className="stat-value">{stats.total}<span className="stat-unit">films</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Watchtime</div>
            <div className="stat-value">{stats.watchtime}<span className="stat-unit">hrs</span></div>
            <div className="stat-sub">{days} days of your life</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg rating</div>
            <div className="stat-value">{stats.avgRating || '—'}<span className="stat-unit">/10</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Hidden gems</div>
            <div className="stat-value">{stats.gems}<span className="stat-unit">found</span></div>
          </div>
          <div className="stat-card add-card" onClick={onAddFilm}>
            <div className="add-icon">+</div>
            <div className="add-label">ADD</div>
          </div>
        </div>

        <div className="trending-section">
          <div className="trending-controls">
            <div className="trending-controls-top">
              <span className="trending-title-label">TRENDING</span>
              <div className="source-tabs">
                {SOURCES.map(s => (
                  <button
                    key={s.key}
                    className={`source-tab${source === s.key ? ' active' : ''}`}
                    style={source === s.key ? { borderColor: s.color, color: s.color, background: `${s.color}14` } : {}}
                    onClick={() => changeSource(s.key)}
                  >
                    <span className="source-dot" style={{ background: s.color }} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="trending-controls-bottom">
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="time-tabs">
                  {showTimeFilter ? TIME_FILTERS.map(t => (
                    <button key={t.key} className={`time-tab${timeFilter === t.key ? ' active' : ''}`} onClick={() => changeTime(t.key)}>
                      {t.label}
                    </button>
                  )) : <span className="time-note mono">Current cinema releases</span>}
                </div>
                {source !== 'nowplaying' && source !== 'tmdb' && (
                  <div className="time-tabs">
                    {RUNTIME_FILTERS.map(r => (
                      <button key={r.key} className={`time-tab${runtimeFilter === r.key ? ' active' : ''}`} onClick={() => changeRuntime(r.key)}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="page-controls">
                <span className="page-info mono">
                  {loading ? 'Loading...' : noResults ? 'No results' : `#${rank(0)}–#${rank(items.length - 1)} · page ${page}/${totalPages}`}
                </span>
                <div className="pagination">
                  <button className="page-btn" onClick={() => goToPage(1)} disabled={page === 1}>«</button>
                  <button className="page-btn" onClick={() => goToPage(page - 1)} disabled={page === 1}>‹</button>
                  {pageButtons().map(p => (
                    <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => goToPage(p)}>{p}</button>
                  ))}
                  <button className="page-btn" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>›</button>
                  <button className="page-btn" onClick={() => goToPage(totalPages)} disabled={page >= totalPages}>»</button>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="trending-loading">Loading {src?.label}...</div>
          ) : noResults ? (
            <div className="trending-loading">No films found — try a wider time period</div>
          ) : (
            <div className="trending-layout">
              {featured && (
                <div
                  className="trending-featured"
                  style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w1280${featured.backdrop_path || featured.poster_path})` }}
                  onClick={() => onFilmClick && onFilmClick(featured)}
                >
                  <div className="trending-featured-overlay">
                    <div className="trending-featured-badge" style={{ color: src?.color }}>
                      #{rank(items.indexOf(featured))} ON {src?.label?.toUpperCase()}
                    </div>
                    <div className="trending-featured-title">{featured.title || featured.name}</div>
                    <div className="trending-featured-meta">
                      {featured.media_type === 'tv' ? 'Series' : 'Film'} &middot;{' '}
                      {(featured.release_date || featured.first_air_date || '—').split('-')[0]} &middot; {featured.vote_average?.toFixed(1)}
                    </div>
                    {featured.overview && (
                      <div className="trending-featured-overview">{featured.overview.slice(0, 220)}...</div>
                    )}
                    <div className="trending-featured-hint mono">Click for ratings & details →</div>
                  </div>
                </div>
              )}
              <div className="trending-list-side">
                {items.map((t, i) => (
                  <div
                    key={`${t.id}-${i}`}
                    className={`trending-side-item${featured?.id === t.id ? ' featured-active' : ''}`}
                    onClick={() => setFeatured(t)}
                  >
                    <div className="trending-side-rank" style={{ color: src?.color }}>#{rank(i)}</div>
                    {t.poster_path
                      ? <img className="trending-side-thumb" src={`${IMG_THUMB}${t.poster_path}`} alt={t.title || t.name} />
                      : <div className="trending-side-no-img">{(t.title || t.name)?.charAt(0)}</div>
                    }
                    <div className="trending-side-info">
                      <div className="trending-side-title">{t.title || t.name}</div>
                      <div className="trending-side-meta mono">{t.vote_average?.toFixed(1)} · {(t.release_date || t.first_air_date || '').split('-')[0]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
