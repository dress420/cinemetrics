import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Stats.css'

export default function Stats() {
  const [films, setFilms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('films').select('*')
    setFilms(data || [])
    setLoading(false)
  }

  if (loading) return <div className="stats-page"><div className="stats-loading">Loading your stats...</div></div>

  const total = films.length
  const seen = films.filter(f => f.status === 'seen' || f.status === 'rewatch').length
  const watchtime = Math.round(films.reduce((s, f) => s + (f.runtime || 100), 0) / 60)
  const days = (watchtime / 24).toFixed(1)
  const rated = films.filter(f => f.user_rating)
  const avgRating = rated.length ? (rated.reduce((s, f) => s + f.user_rating, 0) / rated.length).toFixed(1) : '—'

  const genreCount = {}
  films.forEach(f => (f.genres || []).forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1 }))
  const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxGenre = topGenres[0]?.[1] || 1

  const years = {}
  films.forEach(f => { if (f.release_year) years[f.release_year] = (years[f.release_year] || 0) + 1 })
  const topYears = Object.entries(years).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const ratingDist = Array.from({ length: 10 }, (_, i) => ({
    label: `${i + 1}`,
    count: rated.filter(f => Math.floor(f.user_rating) === i + 1).length
  }))
  const maxRating = Math.max(...ratingDist.map(r => r.count), 1)

  const formats = {}
  films.filter(f => f.format_tag).forEach(f => { formats[f.format_tag] = (formats[f.format_tag] || 0) + 1 })
  const topFormats = Object.entries(formats).sort((a, b) => b[1] - a[1])

  const statusCount = {
    seen: films.filter(f => f.status === 'seen').length,
    watching: films.filter(f => f.status === 'watching').length,
    watchlist: films.filter(f => f.status === 'watchlist').length,
    dropped: films.filter(f => f.status === 'dropped').length,
    rewatch: films.filter(f => f.status === 'rewatch').length,
  }

  return (
    <div className="stats-page">
      <div className="stats-header">
        <div className="page-title">Stats & Wrapped</div>
        <div className="page-sub">Your complete film history at a glance</div>
      </div>

      <div className="stats-hero">
        <div className="hero-stat">
          <div className="hero-num">{total}</div>
          <div className="hero-label">FILMS TOTAL</div>
        </div>
        <div className="hero-divider" />
        <div className="hero-stat">
          <div className="hero-num">{watchtime}<span>hrs</span></div>
          <div className="hero-label">WATCHED</div>
        </div>
        <div className="hero-divider" />
        <div className="hero-stat">
          <div className="hero-num">{days}<span>days</span></div>
          <div className="hero-label">OF YOUR LIFE</div>
        </div>
        <div className="hero-divider" />
        <div className="hero-stat">
          <div className="hero-num">{avgRating}<span>/10</span></div>
          <div className="hero-label">AVG RATING</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-card-title">GENRES</div>
          <div className="genre-bars">
            {topGenres.map(([genre, count]) => (
              <div key={genre} className="genre-bar-row">
                <div className="genre-bar-label">{genre}</div>
                <div className="genre-bar-track">
                  <div className="genre-bar-fill" style={{ width: `${(count / maxGenre) * 100}%` }} />
                </div>
                <div className="genre-bar-count">{count}</div>
              </div>
            ))}
            {topGenres.length === 0 && <div className="stats-empty">No genre data yet</div>}
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-title">YOUR RATINGS</div>
          <div className="rating-bars">
            {ratingDist.map(({ label, count }) => (
              <div key={label} className="rating-col">
                <div className="rating-bar-wrap">
                  <div className="rating-bar-fill" style={{ height: `${(count / maxRating) * 100}%` }} />
                </div>
                <div className="rating-col-label">{label}</div>
              </div>
            ))}
          </div>
          {rated.length === 0 && <div className="stats-empty">Rate your films first</div>}
        </div>

        <div className="stats-card">
          <div className="stats-card-title">STATUS BREAKDOWN</div>
          <div className="status-breakdown">
            {Object.entries(statusCount).map(([status, count]) => (
              <div key={status} className="status-row">
                <div className={`status-dot ${status}`} />
                <div className="status-name">{status.charAt(0).toUpperCase() + status.slice(1)}</div>
                <div className="status-bar-track">
                  <div className="status-bar-fill" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
                </div>
                <div className="status-count">{count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-title">TOP DECADES</div>
          <div className="genre-bars">
            {topYears.map(([year, count]) => (
              <div key={year} className="genre-bar-row">
                <div className="genre-bar-label">{year}</div>
                <div className="genre-bar-track">
                  <div className="genre-bar-fill" style={{ width: `${(count / (topYears[0]?.[1] || 1)) * 100}%` }} />
                </div>
                <div className="genre-bar-count">{count}</div>
              </div>
            ))}
            {topYears.length === 0 && <div className="stats-empty">No year data yet</div>}
          </div>
        </div>

        {topFormats.length > 0 && (
          <div className="stats-card">
            <div className="stats-card-title">WHERE YOU WATCH</div>
            <div className="format-list">
              {topFormats.map(([fmt, count]) => (
                <div key={fmt} className="format-row">
                  <div className="format-name">{fmt}</div>
                  <div className="format-count mono">{count} films</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
