import { useState } from 'react'
import { discoverMovies } from '../lib/tmdb'
import MiniCard from '../components/MiniCard'
import './MoodEngine.css'

const MOODS = [
  { key: 'dark',     emoji: '🖤', label: 'Dark & Gritty',    genres: [80, 53], sort: 'vote_average.desc' },
  { key: 'mindfuck', emoji: '🧠', label: 'Mindfuck',         genres: [878, 9648], sort: 'vote_average.desc' },
  { key: 'intense',  emoji: '⚡', label: 'Intense & Tense',  genres: [28, 53], sort: 'popularity.desc' },
  { key: 'chill',    emoji: '😌', label: 'Chill & Easy',     genres: [35, 10751], sort: 'popularity.desc' },
  { key: 'sad',      emoji: '💧', label: 'Feel Something',   genres: [18, 10749], sort: 'vote_average.desc' },
  { key: 'epic',     emoji: '🔥', label: 'Epic & Grand',     genres: [12, 14], sort: 'popularity.desc' },
  { key: 'horror',   emoji: '👻', label: 'Scared',           genres: [27], sort: 'vote_average.desc' },
  { key: 'smart',    emoji: '🎓', label: 'Smart & Sharp',    genres: [99, 36], sort: 'vote_average.desc' },
]

export default function MoodEngine() {
  const [mood, setMood] = useState(null)
  const [films, setFilms] = useState([])
  const [loading, setLoading] = useState(false)

  const selectMood = async (m) => {
    setMood(m); setLoading(true)
    try {
      const data = await discoverMovies({ with_genres: m.genres.join(','), sort_by: m.sort, 'vote_count.gte': 500, 'vote_average.gte': 6.5 })
      setFilms((data.results || []).filter(r => r.poster_path).slice(0, 24))
    } catch { setFilms([]) }
    setLoading(false)
  }

  return (
    <div className="mood-page">
      <div className="mood-header">
        <div className="page-title">Mood Engine</div>
        <div className="page-sub">How are you feeling tonight? We'll find the perfect film.</div>
      </div>
      <div className="mood-selector">
        {MOODS.map(m => (
          <button key={m.key} className={`mood-option${mood?.key === m.key ? ' active' : ''}`} onClick={() => selectMood(m)}>
            <span className="mood-option-emoji">{m.emoji}</span>
            <span className="mood-option-label">{m.label}</span>
          </button>
        ))}
      </div>
      {loading && <div className="mood-loading">Finding the perfect films for your mood...</div>}
      {!loading && films.length > 0 && (
        <>
          <div className="mood-results-header"><div className="mood-results-title">{mood.emoji} Perfect for <span>{mood.label}</span></div></div>
          <div className="mc-grid">{films.map(f => <MiniCard key={f.id} film={f} />)}</div>
        </>
      )}
      {!mood && <div className="mood-prompt"><div className="mood-prompt-icon">🎬</div><div className="mood-prompt-text">Select a mood above to get personalized recommendations</div></div>}
    </div>
  )
}
