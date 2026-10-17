import { useState, useEffect } from 'react'
import { ThumbsUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { discoverMovies } from '../lib/tmdb'
import MiniCard from '../components/MiniCard'
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
    if (myFilms.length === 0) { setLoading(false); return }

    const genreCount = {}
    myFilms.forEach(f => (f.genres || []).forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1 }))
    const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g)
    const topGenreId = GENRE_IDS[topGenres[0]]
    const myTmdbIds = new Set(myFilms.map(f => f.tmdb_id))
    const rated = myFilms.filter(f => f.user_rating)
    const avgRating = rated.length ? rated.reduce((s, f) => s + f.user_rating, 0) / rated.length : 7

    try {
      const params = { sort_by: 'vote_average.desc', 'vote_count.gte': 500, 'vote_average.gte': Math.max(6, avgRating - 1) }
      if (topGenreId) params.with_genres = topGenreId
      const data = await discoverMovies(params)
      setRecs((data.results || []).filter(r => !myTmdbIds.has(r.id) && r.poster_path).slice(0, 24))
      setReason(topGenres[0] ? `Based on your love of ${topGenres.slice(0, 2).join(' & ')}` : 'Based on your watch history')
    } catch { setRecs([]) }
    setLoading(false)
  }

  return (
    <div className="recs-page">
      <div className="recs-header">
        <div className="page-title">For You</div>
        <div className="page-sub">{reason || 'Analyzing your taste...'}</div>
      </div>
      {loading ? <div className="recs-loading">Analyzing your taste…</div>
        : films.length === 0 ? <div className="empty-state"><div className="empty-state-icon"><ThumbsUp size={24} strokeWidth={1.6} /></div><div className="empty-state-title">Not enough data yet</div><div className="empty-state-sub">Add at least 5 films to get recommendations</div></div>
        : <div className="mc-grid">{recs.map(f => <MiniCard key={f.id} film={f} />)}</div>
      }
    </div>
  )
}
