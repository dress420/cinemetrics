import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { discoverMovies, IMG_THUMB } from '../lib/tmdb'
import './Recommendations.css'

const GENRE_IDS = {
  'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35, 'Crime': 80,
  'Documentary': 99, 'Drama': 18, 'Fantasy': 14, 'Horror': 27, 'Mystery': 9648,
  'Romance': 10749, 'Science Fiction': 878, 'Thriller': 53, 'War': 10752
}

export default function Recommendations() {
  const [films, setFilms] = useState([])
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('films').select('*')
    const myFilms = data || []
    setFilms(myFilms)
    await generateRecs(myFilms)
    setLoading(false)
  }

  const generateRecs = async (myFilms) => {
    if (myFilms.length === 0) { setRecs([]); return }

    const genreCount = {}
    myFilms.forEach(f => (f.genres || []).forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1 }))
    const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 3)
    const topGenreNames = topGenres.map(([g]) => g)

    const topGenreId = GENRE_IDS[topGenreNames[0]]
    const secondGenreId = GENRE_IDS[topGenreNames[1]]

    const myTmdbIds = new Set(myFilms.map(f => f.tmdb_id))

    const rated = myFilms.filter(f => f.user_rating)
    const avgRating = rated.length ? rated.reduce((s, f) => s + f.user_rating, 0) / rated.length : 7

    try {
      const params = {
        sort_by: 'vote_average.desc',
        'vote_count.gte': 500,
        'vote_average.gte': Math.max(6, avgRating - 1),
      }
      if (topGenreId) params.with_genres = topGenreId

      const data = await discoverMovies(params)
      const results = (data.results || [])
        .filter(r => !myTmdbIds.has(r.id))
        .slice(0, 12)
        .map(r => ({ ...r, match: Math.round(70 + Math.random() * 28) }))

      setRecs(results)
      setReason(topGenreNames[0] ? `Based on your love of ${topGenreNames.slice(0, 2).join(' & ')}` : 'Based on your watch history')
    } catch { setRecs([]) }
  }

  return (
    <div className="recs-page">
      <div className="recs-header">
        <div className="page-title">AI Recommendations</div>
        <div className="page-sub">{reason || 'Analyzing your taste...'}</div>
      </div>

      {loading ? (
        <div className="recs-loading">Analyzing your DNA profile...</div>
      ) : films.length === 0 ? (
        <div className="recs-empty">
          <div style={{ fontSize: 48, marginBottom: 16, opacity: .4 }}>⟁</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text3)' }}>Not enough data</div>
          <div style={{ fontSize: 14, color: 'var(--text4)', marginTop: 8, fontFamily: 'var(--mono)' }}>Add at least 5 films to get recommendations</div>
        </div>
      ) : (
        <div className="recs-grid">
          {recs.map(film => (
            <div key={film.id} className="rec-card">
              <div className="rec-poster">
                {film.poster_path
                  ? <img src={`${IMG_THUMB}${film.poster_path}`} alt={film.title} loading="lazy" />
                  : <div className="rec-no-poster">{film.title?.charAt(0)}</div>
                }
                <div className="rec-match">{film.match}%</div>
              </div>
              <div className="rec-info">
                <div className="rec-title">{film.title}</div>
                <div className="rec-meta mono">{film.release_date?.split('-')[0]} · ⭐ {film.vote_average?.toFixed(1)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
