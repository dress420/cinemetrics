import { useState, useEffect, useRef } from 'react'
import { Search, Plus, ChevronLeft, ChevronRight, ArrowRight, Star, Film, AlertTriangle } from 'lucide-react'
import { IMG_THUMB } from '../lib/tmdb'
import { useRatings } from '../hooks/useRatings'
import { fetchList, isRankedSource, RUNTIME_FILTERS, PAGE_SIZE } from '../lib/rankings'
import { formatValue, normalize, tone } from '../lib/ratings'
import RatingsBoard, { ProviderMark } from '../components/RatingsBoard'
import './Dashboard.css'

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
  const [meta,          setMeta]          = useState({ label: '', provider: null, degraded: null })
  const fetchId = useRef(0)
  const listRef = useRef(null)
  // Ratings aller Anbieter für den Film im Hero (kurz verzögert beim schnellen Durchklicken)
  const heroRatings = useRatings(featured, { delay: 350 })

  useEffect(() => {
    const id = ++fetchId.current
    setLoading(true)
    setError('')
    fetchList({ source, time: timeFilter, page, runtime: runtimeFilter })
      .then(({ items, totalPages, label, provider, degraded }) => {
        if (id !== fetchId.current) return
        setItems(items)
        setFeatured(items[0] || null)
        setTotalPages(totalPages)
        setMeta({ label, provider, degraded })
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
  const rank = (i) => (page - 1) * PAGE_SIZE + i + 1
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
        <div className="dash-head-top">
          <div>
            <div className="dash-eyebrow">{dateLabel}</div>
            <h1 className="page-title">{greeting()}</h1>
          </div>
          {!isMobile && (
            <button className="btn-secondary dash-add" onClick={onAddFilm}>
              <Plus size={16} strokeWidth={2.25} /> Add film
            </button>
          )}
        </div>
        <button className="dash-search" onClick={onSearch}>
          <Search size={20} strokeWidth={2} />
          <span className="dash-search-text">
            <span className="dash-search-main">Check any film or series</span>
            <span className="dash-search-sub">IMDb · Rotten Tomatoes · Metacritic · Letterboxd · TMDB</span>
          </span>
          {!isMobile && <kbd>⌘K</kbd>}
        </button>
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

        {source !== 'nowplaying' && (
          <div className={`trend-caption${!loading && meta.degraded ? ' is-warning' : ''}`} aria-live="polite">
            {loading
              ? (isRankedSource(source) ? `Fetching live ${src?.label} scores…` : 'Loading…')
              : <>{meta.degraded && <AlertTriangle size={13} />}{meta.label}</>}
          </div>
        )}

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
                  #{rank(featuredIndex)} on {meta.degraded ? 'TMDB' : src?.label}
                </div>
                <h3 className="trend-hero-title">{featured.title || featured.name}</h3>
                <div className="trend-hero-meta">
                  <span>{featured.media_type === 'tv' ? 'Series' : 'Film'}</span>
                  {year(featured) && <span>{year(featured)}</span>}
                  {featured.vote_average > 0 && (
                    <span className="star-inline"><Star size={12} fill="currentColor" strokeWidth={0} />{featured.vote_average.toFixed(1)}</span>
                  )}
                </div>
                <div className="trend-hero-ratings"><RatingsBoard ratings={heroRatings} variant="compact" /></div>
                {featured.overview && <p className="trend-hero-overview">{featured.overview}</p>}
                <span className="trend-hero-cta">All ratings &amp; details <ArrowRight size={14} /></span>
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
                          {meta.provider ? (
                            <span className={`trend-row-score rb-tone-${tone(normalize(meta.provider, t.score?.value))}`}>
                              <ProviderMark provider={meta.provider} value={t.score?.value} size="xs" />
                              <b>{formatValue(meta.provider, t.score?.value)}</b>
                            </span>
                          ) : t.vote_average > 0 && (
                            <span className="trend-row-star"><Star size={10} fill="currentColor" strokeWidth={0} /> {t.vote_average.toFixed(1)}</span>
                          )}
                          <span>{[year(t), t.media_type === 'tv' ? 'Series' : null].filter(Boolean).join(' · ')}</span>
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
