import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { IMG_BASE, IMG_THUMB } from '../lib/tmdb'
import './TonightsPick.css'

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
      const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g)
      const rated = lib.filter(f => f.user_rating)
      const avgRating = rated.length ? (rated.reduce((s, f) => s + f.user_rating, 0) / rated.length).toFixed(1) : '7'
      const watchlist = lib.filter(f => f.status === 'watchlist').map(f => `${f.title} (${f.release_year})`).slice(0, 10)

      const now = new Date()
      const day = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()]
      const hour = now.getHours()
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'late night'

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are a film recommendation AI. Here's the user's profile:
- Top genres: ${topGenres.join(', ')}
- Average rating: ${avgRating}/10
- ${lib.length} films in library
- Watchlist: ${watchlist.length > 0 ? watchlist.join(', ') : 'empty'}
- Current time: ${timeOfDay} on ${day}

${watchlist.length > 0 ? 'Pick from their watchlist if possible, otherwise suggest something new.' : 'Suggest a great film.'}

Return ONLY valid JSON:
{
  "title": "Film Title",
  "year": 2020,
  "reason": "A personal, warm 2-sentence reason why THIS film, TONIGHT specifically. Reference the time/day.",
  "mood": "one word mood",
  "genres": ["genre1", "genre2"]
}`
          }],
        }),
      })

      const data = await res.json()
      const text = data.content?.map(c => c.text || '').join('') || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const rec = JSON.parse(clean)

      // Search TMDB for poster
      const tmdbRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${encodeURIComponent(rec.title)}&year=${rec.year}`)
      const tmdbData = await tmdbRes.json()
      const match = (tmdbData.results || [])[0]

      setPick({
        ...rec,
        poster_path: match?.poster_path || null,
        backdrop_path: match?.backdrop_path || null,
        tmdb_id: match?.id,
        vote_average: match?.vote_average,
        overview: match?.overview,
      })
    } catch (e) {
      setError('Could not generate pick — try again.')
    }
    setLoading(false)
  }

  useEffect(() => { generate() }, [])

  return (
    <div className="tp-page">
      <div className="tp-header-bar">
        <div>
          <div className="page-title">Tonight's Pick</div>
          <div className="page-sub">AI picks the perfect film for right now.</div>
        </div>
        <button className="btn-primary" onClick={generate} disabled={loading}>
          {loading ? 'Thinking...' : '↻ New Pick'}
        </button>
      </div>

      {loading && (
        <div className="tp-loading">
          <div className="tp-loading-icon">🎬</div>
          <div className="tp-loading-text mono">Finding your perfect film for tonight...</div>
        </div>
      )}

      {error && <div className="tp-error mono">{error}</div>}

      {!loading && pick && (
        <div
          className="tp-hero"
          style={pick.backdrop_path ? {
            backgroundImage: `url(https://image.tmdb.org/t/p/w1280${pick.backdrop_path})`
          } : {}}
        >
          <div className="tp-hero-overlay">
            <div className="tp-hero-content">
              <div className="tp-tonight-label mono">TONIGHT YOU SHOULD WATCH</div>
              <div className="tp-hero-row">
                {pick.poster_path && (
                  <img className="tp-poster" src={`${IMG_THUMB}${pick.poster_path}`} alt={pick.title} />
                )}
                <div className="tp-hero-info">
                  <h1 className="tp-title">{pick.title}</h1>
                  <div className="tp-meta mono">
                    {pick.year}
                    {pick.vote_average ? ` · ⭐ ${pick.vote_average.toFixed(1)}` : ''}
                    {pick.mood ? ` · ${pick.mood}` : ''}
                  </div>
                  <div className="tp-genres">
                    {(pick.genres || []).map(g => <span key={g} className="tag">{g}</span>)}
                  </div>
                  <div className="tp-reason">{pick.reason}</div>
                  {pick.overview && (
                    <div className="tp-overview">{pick.overview.slice(0, 200)}...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
