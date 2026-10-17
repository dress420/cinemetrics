import { useState, useEffect, useRef } from 'react'
import { Search, Plus, ChevronLeft, ChevronRight, ArrowRight, Star, Film } from 'lucide-react'
import { IMG_THUMB } from '../lib/tmdb'
import './Dashboard.css'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE    = 'https://api.themoviedb.org/3'
const MAX_PAGES = 50

const SOURCES = [
  { key: 'tmdb',         label: 'TMDB',            color: '#01b4e4' },
  { key: 'imdb',         label: 'IMDb',            color: '#f5c518' },
  { key: 'rottentomato', label: 'Rotten Tomatoes', color: '#fa320a' },
  { key: 'metacritic',   label: 'Metacritic',      color: '#ffcc34' },
  { key: 'letterboxd',   label: 'Letterboxd',      color: '#00c030' },
  { key: 'nowplaying',   label: 'In Cinemas',      color: '#a855f7' },
]

const TIME_FILTERS = [
  { key: 'day',     label: 'Today'      },
  { key: 'week',    label: 'This Week'  },
  { key: 'month',   label: 'This Month' },
  { key: 'year',    label: 'This Year'  },
  { key: 'alltime', label: 'All Time'   },
]

const RUNTIME_FILTERS = [
  { key: 'any',    label: 'Any length',  lte: null, gte: null },
  { key: 'short',  label: 'Under 90 min', lte: 90,  gte: null },
  { key: 'medium', label: '90–120 min',  lte: 120,  gte: 90 },
  { key: 'epic',   label: '2h+',         lte: null, gte: 120 },
]

// Mindest-Stimmen pro Quelle & Zeitraum. Jede Stufe wird nur probiert,
// wenn die vorherige zu wenig Treffer liefert — so ist keine Liste mehr leer.
const VOTE_STEPS = {
  tmdb:         { month: [10, 0],        year: [50, 10],       alltime: [1000] },
  imdb:         { month: [100, 30, 10],  year: [500, 150, 40], alltime: [10000, 3000] },
  rottentomato: { month: [10, 0],        year: [50, 10],       alltime: [2000, 500] },
  metacritic:   { month: [40, 15, 5],    year: [200, 60, 20],  alltime: [1500, 500] },
  letterboxd:   { month: [20, 8, 3],     year: [80, 25, 8],    alltime: [300, 100] },
}
const SORT_BY = {
  tmdb: 'popularity.desc', imdb: 'vote_average.desc', rottentomato: 'popularity.desc',
  metacritic: 'vote_average.desc', letterboxd: 'vote_average.desc',
}

const iso = (d) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return z.toISOString().slice(0, 10)
}
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d) }

function dateWindow(time, widen = false) {
  const today = iso(new Date())
  if (time === 'month') return { gte: daysAgo(widen ? 90 : 30), lte: today }
  if (time === 'year')  return { gte: widen ? daysAgo(365) : `${new Date().getFullYear()}-01-01`, lte: today }
  return null
}

const url = (path, params) =>
  `${BASE}${path}?${new URLSearchParams({ api_key: API_KEY, language: 'en-US', ...params })}`

const getJSON = async (u) => {
  const res = await fetch(u)
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  return res.json()
}

const clean = (results, fallbackType) =>
  (results || [])
    .filter(r => r.poster_path && r.media_type !== 'person')
    .map(r => ({ ...r, media_type: r.media_type || fallbackType }))

// IMDb-Formel (gewichtete Bewertung) — verhindert, dass Filme mit 12 Stimmen ganz oben landen
const weighted = (r, m = 250, C = 6.6) => {
  const v = r.vote_count || 0
  return (v / (v + m)) * (r.vote_average || 0) + (m / (v + m)) * C
}

async function fetchTrending({ source, time, page, runtime }) {
  // Kinos: aktuelle Filme in Deutschland
  if (source === 'nowplaying') {
    const d = await getJSON(url('/movie/now_playing', { page, region: 'DE' }))
    return { items: clean(d.results, 'movie'), totalPages: d.total_pages }
  }

  // Heute / diese Woche: was gerade trendet, je nach Quelle anders sortiert
  if (time === 'day' || time === 'week') {
    if (source === 'tmdb') {
      const d = await getJSON(url(`/trending/all/${time}`, { page }))
      return { items: clean(d.results), totalPages: d.total_pages }
    }
    const d = await getJSON(url(`/trending/movie/${time}`, { page }))
    let items = clean(d.results, 'movie')
    if (source === 'imdb')       items.sort((a, b) => weighted(b) - weighted(a))
    if (source === 'metacritic') items.sort((a, b) => weighted(b, 60) - weighted(a, 60))
    if (source === 'letterboxd') {
      const en = items.filter(i => i.original_language === 'en')
      items = (en.length >= 8 ? en : items).sort((a, b) => weighted(b, 120) - weighted(a, 120))
    }
    if (items.length) return { items, totalPages: d.total_pages }
    // falls die Trendliste leer ist, unten mit "Diesen Monat" weitermachen
    time = 'month'
  }

  // Monat / Jahr / Allzeit: TMDB Discover mit gestaffelter Lockerung
  const rt = RUNTIME_FILTERS.find(r => r.key === runtime) || RUNTIME_FILTERS[0]
  const steps = VOTE_STEPS[source]?.[time] || [0]
  const windows = time === 'alltime' ? [null] : [dateWindow(time), dateWindow(time, true)]
  let last = { items: [], totalPages: 1 }

  for (const win of windows) {
    for (const minVotes of steps) {
      const params = {
        page,
        sort_by: source === 'tmdb' && time === 'alltime' ? 'vote_count.desc' : SORT_BY[source],
        include_adult: 'false',
        'vote_count.gte': minVotes,
      }
      if (win) { params['primary_release_date.gte'] = win.gte; params['primary_release_date.lte'] = win.lte }
      if (rt.lte) params['with_runtime.lte'] = rt.lte
      if (rt.gte) params['with_runtime.gte'] = rt.gte
      if (source === 'letterboxd') params.with_original_language = 'en'
      const d = await getJSON(url('/discover/movie', params))
      last = { items: clean(d.results, 'movie'), totalPages: d.total_pages }
      if (last.items.length >= 8 || page > 1) return last
    }
  }
  return last
}

function greeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Late night picks'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard({ onAddFilm, onSearch, onFilmClick, isMobile }) {
  const [items,         setItems]         = useState([])
  const [featured,      setFeatured]      = useState(null)
  const [source,        setSource]        = useState('tmdb')
  const [timeFilter,    setTimeFilter]    = useState('week')
  const [runtimeFilter, setRuntimeFilter] = useState('any')
  const [page,          setPage]          = useState(1)
  const [totalPages,    setTotalPages]    = useState(1)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const fetchId = useRef(0)
  const listRef = useRef(null)

  useEffect(() => {
    const id = ++fetchId.current
    setLoading(true)
    setError('')
    fetchTrending({ source, time: timeFilter, page, runtime: runtimeFilter })
      .then(({ items, totalPages }) => {
        if (id !== fetchId.current) return
        setItems(items)
        setFeatured(items[0] || null)
        setTotalPages(Math.max(1, Math.min(totalPages || 1, MAX_PAGES)))
        setLoading(false)
        listRef.current?.scrollTo(0, 0)
      })
      .catch(() => {
        if (id !== fetchId.current) return
        setItems([]); setFeatured(null); setLoading(false)
        setError('Could not reach TMDB — check your connection and try again.')
      })
  }, [source, timeFilter, page, runtimeFilter])

  const changeSource  = (s) => { if (s !== source) { setPage(1); setSource(s) } }
  const changeTime    = (t) => { if (t !== timeFilter) { setPage(1); setTimeFilter(t) } }
  const changeRuntime = (r) => { if (r !== runtimeFilter) { setPage(1); setRuntimeFilter(r) } }
  const goToPage      = (p) => { if (p >= 1 && p <= totalPages && p !== page) setPage(p) }

  const src = SOURCES.find(s => s.key === source)
  const rank = (i) => (page - 1) * 20 + i + 1
  const showTime = source !== 'nowplaying'
  const showRuntime = source !== 'nowplaying' && !['day', 'week'].includes(timeFilter)

  const pageButtons = () => {
    let start = Math.max(1, page - 2)
    const end = Math.min(totalPages, start + 4)
    start = Math.max(1, end - 4)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const year = (f) => (f.release_date || f.first_air_date || '').split('-')[0]
  const featuredIndex = featured ? items.indexOf(featured) : -1
  const heroImg = featured?.backdrop_path
    ? `https://image.tmdb.org/t/p/${isMobile ? 'w780' : 'w1280'}${featured.backdrop_path}`
    : featured?.poster_path ? `https://image.tmdb.org/t/p/w500${featured.poster_path}` : null

  const onItemClick = (t) => {
    // Auf dem Handy direkt die Details öffnen, am Desktop erst als Hero anzeigen
    if (isMobile) onFilmClick?.(t)
    else setFeatured(t)
  }

  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="dashboard">
      <header className="dash-head">
        <div>
          <div className="dash-eyebrow">{dateLabel}</div>
          <h1 className="page-title">{greeting()}</h1>
        </div>
        {!isMobile && (
          <div className="dash-actions">
            <button className="dash-search" onClick={onSearch}>
              <Search size={16} strokeWidth={2} />
              <span>Search films &amp; series</span>
              <kbd>⌘K</kbd>
            </button>
            <button className="btn-primary" onClick={onAddFilm}>
              <Plus size={16} strokeWidth={2.5} /> Add film
            </button>
          </div>
        )}
      </header>

      <section className="trend" aria-label="Trending">
        <div className="trend-head">
          <h2 className="trend-title">Trending</h2>
          <div className="chip-row" role="tablist" aria-label="Source">
            {SOURCES.map(s => (
              <button
                key={s.key}
                role="tab"
                aria-selected={source === s.key}
                className={`chip${source === s.key ? ' active' : ''}`}
                style={source === s.key ? { '--chip': s.color } : undefined}
                onClick={() => changeSource(s.key)}
              >
                <span className="chip-dot" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="trend-filters">
          <div className="trend-filter-groups">
            {showTime ? (
              <div className="seg" role="tablist" aria-label="Time period">
                {TIME_FILTERS.map(t => (
                  <button key={t.key} className={`seg-btn${timeFilter === t.key ? ' active' : ''}`} onClick={() => changeTime(t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>
            ) : (
              <span className="trend-note">Now showing in German cinemas</span>
            )}
            {showRuntime && (
              <div className="seg" role="tablist" aria-label="Runtime">
                {RUNTIME_FILTERS.map(r => (
                  <button key={r.key} className={`seg-btn${runtimeFilter === r.key ? ' active' : ''}`} onClick={() => changeRuntime(r.key)}>
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pager">
            <span className="pager-info">
              {loading ? 'Loading…' : items.length ? `#${rank(0)}–#${rank(items.length - 1)} · ${page}/${totalPages}` : '—'}
            </span>
            <button className="pager-btn" onClick={() => goToPage(page - 1)} disabled={page === 1 || loading} aria-label="Previous page">
              <ChevronLeft size={16} />
            </button>
            {!isMobile && pageButtons().map(p => (
              <button key={p} className={`pager-btn${page === p ? ' active' : ''}`} onClick={() => goToPage(p)} disabled={loading}>{p}</button>
            ))}
            <button className="pager-btn" onClick={() => goToPage(page + 1)} disabled={page >= totalPages || loading} aria-label="Next page">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="trend-body is-loading" aria-busy="true">
            <div className="trend-hero"><div className="trend-hero-media skeleton" /></div>
            <div className="trend-list">
              <div className="trend-list-inner">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="trend-row skeleton-row">
                    <span className="skeleton sk-rank" /><span className="skeleton sk-thumb" />
                    <span className="sk-lines"><span className="skeleton sk-line" /><span className="skeleton sk-line short" /></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : error || !featured ? (
          <div className="trend-empty">
            <Film size={28} strokeWidth={1.5} />
            <div>{error || 'Nothing here — try another time period.'}</div>
          </div>
        ) : (
          <div className="trend-body">
            <article
              className="trend-hero"
              onClick={() => onFilmClick?.(featured)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onFilmClick?.(featured)}
            >
              <div className={`trend-hero-media${featured.backdrop_path ? '' : ' is-poster'}`}>
                {!featured.backdrop_path && heroImg && <img className="trend-hero-blur" src={heroImg} alt="" aria-hidden="true" />}
                {heroImg && <img key={heroImg} className="trend-hero-img" src={heroImg} alt="" />}
              </div>
              <div className="trend-hero-info">
                <div className="trend-hero-badge" style={{ color: src?.color }}>
                  #{rank(featuredIndex)} on {src?.label}
                </div>
                <h3 className="trend-hero-title">{featured.title || featured.name}</h3>
                <div className="trend-hero-meta">
                  <span>{featured.media_type === 'tv' ? 'Series' : 'Film'}</span>
                  {year(featured) && <span>{year(featured)}</span>}
                  {featured.vote_average > 0 && (
                    <span className="star-inline"><Star size={12} fill="currentColor" strokeWidth={0} />{featured.vote_average.toFixed(1)}</span>
                  )}
                </div>
                {featured.overview && <p className="trend-hero-overview">{featured.overview}</p>}
                <span className="trend-hero-cta">Ratings &amp; details <ArrowRight size={14} /></span>
              </div>
            </article>

            <div className="trend-list">
              <ol className="trend-list-inner" ref={listRef}>
                {items.map((t, i) => (
                  <li key={`${t.media_type}-${t.id}`}>
                    <button
                      className={`trend-row${featured === t ? ' active' : ''}`}
                      onClick={() => onItemClick(t)}
                    >
                      <span className="trend-rank" style={featured === t ? { color: src?.color } : undefined}>
                        {String(rank(i)).padStart(2, '0')}
                      </span>
                      <img className="trend-thumb" src={`${IMG_THUMB}${t.poster_path}`} alt="" loading="lazy" />
                      <span className="trend-row-info">
                        <span className="trend-row-title">{t.title || t.name}</span>
                        <span className="trend-row-meta">
                          {t.vote_average > 0 && <><Star size={10} fill="currentColor" strokeWidth={0} /> {t.vote_average.toFixed(1)} · </>}
                          {year(t)}{t.media_type === 'tv' ? ' · Series' : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
