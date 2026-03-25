import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { discoverMovies, IMG_THUMB } from '../lib/tmdb'
import './TonightsPick.css'

const GENRE_IDS = {
  'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35, 'Crime': 80,
  'Documentary': 99, 'Drama': 18, 'Fantasy': 14, 'Horror': 27, 'Mystery': 9648,
  'Romance': 10749, 'Science Fiction': 878, 'Sci-Fi': 878, 'Thriller': 53, 'War': 10752,
  'Family': 10751, 'History': 36, 'Music': 10402, 'Western': 37,
}

const TIME_VIBES = {
  morning:   { mood: 'Uplifting',  genres: [35, 12, 10751], reason: 'morning — something light to start the day' },
  afternoon: { mood: 'Engaging',   genres: [28, 12, 878],   reason: 'afternoon — peak energy, go for something exciting' },
  evening:   { mood: 'Immersive',  genres: [18, 53, 80],    reason: "evening — time to sink into a good story" },
  latenight: { mood: 'Intense',    genres: [27, 9648, 53],  reason: "late night — the perfect hour for something dark" },
}

const DAY_VIBES = [
  'Easy Sunday — recharge before the week', 'Monday escape — forget the grind',
  'Tuesday treat — mid-week pick-me-up', 'Hump day reward — you deserve this',
  'Thursday thriller — almost weekend', 'Friday night vibes — go all in',
  'Saturday cinema — your time to explore',
]

export default function TonightsPick() {
  const [pick, setPick] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    setPick(null)

    try {
      const { data: films } = await supabase.from('films').select('*')
      const lib = films || []

      const genreCount = {}
      lib.forEach(f => (f.genres || []).forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1 }))
      const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 3)
      const topGenreIds = topGenres.map(([name]) => GENRE_IDS[name]).filter(Boolean)

      const rated = lib.filter(f => f.user_rating)
      const avgRating = rated.length ? rated.reduce((s, f) => s + f.user_rating, 0) / rated.length : 7

      const now = new Date()
      const hour = now.getHours()
      const timeKey = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'latenight'
      const timeVibe = TIME_VIBES[timeKey]
      const dayVibe = DAY_VIBES[now.getDay()]

      // Try watchlist first
      const watchlist = lib.filter(f => f.status === 'watchlist')
      if (watchlist.length > 0) {
        const random = watchlist[Math.floor(Math.random() * watchlist.length)]
        setPick({
          title: random.title, year: random.release_year,
          poster_path: random.poster_path, backdrop_path: random.backdrop_path,
          vote_average: random.vote_average, overview: random.overview,
          genres: random.genres || [], mood: timeVibe.mood,
          reason: `It's been on your watchlist — and it's ${timeVibe.reason}. ${dayVibe}.`,
          fromWatchlist: true,
        })
        setLoading(false)
        return
      }

      // Discover something new
      const mixedGenres = [...new Set([...topGenreIds.slice(0, 1), ...timeVibe.genres.slice(0, 1)])]
      const data = await discoverMovies({
        with_genres: mixedGenres.join(','),
        sort_by: 'vote_average.desc',
        'vote_count.gte': 500,
        'vote_average.gte': Math.max(6.5, avgRating - 1),
        page: Math.floor(Math.random() * 5) + 1,
      })

      const results = (data.results || []).filter(r => r.poster_path)
      const myIds = new Set(lib.map(f => f.tmdb_id))
      const unseen = results.filter(r => !myIds.has(r.id))
      const chosen = unseen[Math.floor(Math.random() * Math.min(unseen.length, 5))] || results[0]

      if (!chosen) { setError('No pick found — add more films to your library.'); setLoading(false); return }

      setPick({
        title: chosen.title,
        year: chosen.release_date ? parseInt(chosen.release_date.split('-')[0]) : null,
        poster_path: chosen.poster_path, backdrop_path: chosen.backdrop_path,
        vote_average: chosen.vote_average, overview: chosen.overview,
        genres: [], mood: timeVibe.mood,
        reason: `Based on your love of ${topGenres[0]?.[0] || 'great films'} — it's ${timeVibe.reason}. ${dayVibe}.`,
        fromWatchlist: false,
      })
    } catch { setError('Could not generate pick — try again.') }
    setLoading(false)
  }

  useEffect(() => { generate() }, [])

  return (
    <div className="tp-page">
      <div className="tp-header-bar">
        <div>
          <div className="page-title">Tonight's Pick</div>
          <div className="page-sub">The perfect film for right now.</div>
        </div>
        <button className="btn-primary" onClick={generate} disabled={loading}>
          {loading ? 'Thinking...' : '↻ New Pick'}
        </button>
      </div>

      {loading && (
        <div className="tp-loading">
          <div className="tp-loading-icon">🎬</div>
          <div className="tp-loading-text mono">Finding your perfect film...</div>
        </div>
      )}

      {error && <div className="tp-error mono">{error}</div>}

      {!loading && pick && (
        <div className="tp-hero" style={pick.backdrop_path ? { backgroundImage: `url(https://image.tmdb.org/t/p/w1280${pick.backdrop_path})` } : {}}>
          <div className="tp-hero-overlay">
            <div className="tp-hero-content">
              <div className="tp-tonight-label mono">
                {pick.fromWatchlist ? 'FROM YOUR WATCHLIST — TONIGHT' : 'TONIGHT YOU SHOULD WATCH'}
              </div>
              <div className="tp-hero-row">
                {pick.poster_path && <img className="tp-poster" src={`${IMG_THUMB}${pick.poster_path}`} alt={pick.title} />}
                <div className="tp-hero-info">
                  <h1 className="tp-title">{pick.title}</h1>
                  <div className="tp-meta mono">
                    {pick.year}{pick.vote_average ? ` · ⭐ ${pick.vote_average.toFixed(1)}` : ''}{pick.mood ? ` · ${pick.mood}` : ''}
                  </div>
                  <div className="tp-genres">{(pick.genres || []).map(g => <span key={g} className="tag">{g}</span>)}</div>
                  <div className="tp-reason">{pick.reason}</div>
                  {pick.overview && <div className="tp-overview">{pick.overview.slice(0, 200)}...</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
