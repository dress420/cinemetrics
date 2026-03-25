import { useState } from 'react'
import { discoverMovies } from '../lib/tmdb'
import MiniCard from '../components/MiniCard'
import './Vibes.css'

const VIBES = [
  { key: 'rainy',       emoji: '🌧️', label: 'Rainy Day',              genres: '18',        sort: 'vote_average.desc', voteGte: 500 },
  { key: 'feelgood',    emoji: '☀️', label: 'Feel Good',              genres: '35,10751',  sort: 'popularity.desc',   voteGte: 500 },
  { key: 'mindblowing', emoji: '🤯', label: 'Mind-Blowing Ending',    genres: '53,9648',   sort: 'vote_average.desc', voteGte: 500 },
  { key: 'truestory',   emoji: '📖', label: 'Based on True Story',    genres: '18,36',     sort: 'popularity.desc',   voteGte: 200 },
  { key: 'cantlook',    emoji: '😱', label: "Can't Look Away",        genres: '53,27',     sort: 'vote_average.desc', voteGte: 500 },
  { key: 'cry',         emoji: '😭', label: 'Cry Your Eyes Out',      genres: '18,10749',  sort: 'vote_average.desc', voteGte: 500 },
  { key: 'datenight',   emoji: '❤️', label: 'Date Night',             genres: '35,10749',  sort: 'popularity.desc',   voteGte: 300 },
  { key: 'alone3am',    emoji: '🌙', label: 'Watch Alone at 3am',     genres: '27,9648',   sort: 'vote_average.desc', voteGte: 200 },
  { key: 'underrated',  emoji: '💎', label: 'Underrated Masterpiece', genres: '18',        sort: 'vote_average.desc', voteGte: 50,  voteLte: 500 },
  { key: 'style',       emoji: '🎨', label: 'Style over Substance',   genres: '878,28',    sort: 'popularity.desc',   voteGte: 200 },
  { key: 'thinking',    emoji: '🧠', label: 'Thought-Provoking',      genres: '878,18',    sort: 'vote_average.desc', voteGte: 500 },
  { key: 'escapism',    emoji: '🚀', label: 'Pure Escapism',          genres: '12,14,28',  sort: 'popularity.desc',   voteGte: 500 },
  { key: 'disturbing',  emoji: '⚠️', label: 'Disturbing but Important', genres: '18,10752', sort: 'vote_average.desc', voteGte: 300 },
  { key: 'laugh',       emoji: '🤣', label: 'Laugh until you cry',    genres: '35',        sort: 'popularity.desc',   voteGte: 1000 },
]

export default function Vibes() {
  const [selected, setSelected] = useState(null)
  const [films, setFilms] = useState([])
  const [loading, setLoading] = useState(false)

  const selectVibe = async (vibe) => {
    setSelected(vibe); setLoading(true)
    try {
      const params = { with_genres: vibe.genres, sort_by: vibe.sort, 'vote_count.gte': vibe.voteGte, 'vote_average.gte': 6 }
      if (vibe.voteLte) params['vote_count.lte'] = vibe.voteLte
      const data = await discoverMovies(params)
      setFilms((data.results || []).filter(r => r.poster_path).slice(0, 24))
    } catch { setFilms([]) }
    setLoading(false)
  }

  return (
    <div className="vibes-page">
      <div className="vibes-header">
        <div className="page-title">Vibes</div>
        <div className="page-sub">Pick a vibe. We'll find the films.</div>
      </div>
      <div className="vibes-grid">
        {VIBES.map(v => (
          <button key={v.key} className={`vibe-card${selected?.key === v.key ? ' active' : ''}`} onClick={() => selectVibe(v)}>
            <span className="vibe-emoji">{v.emoji}</span>
            <span className="vibe-label">{v.label}</span>
          </button>
        ))}
      </div>
      {loading && <div className="vibes-loading mono">Finding your vibe...</div>}
      {!loading && selected && films.length > 0 && (
        <>
          <div className="vibes-results-header">
            <span className="vibes-results-emoji">{selected.emoji}</span>
            <span className="vibes-results-title">{selected.label}</span>
          </div>
          <div className="mc-grid">{films.map(f => <MiniCard key={f.id} film={f} />)}</div>
        </>
      )}
      {!selected && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}><div style={{ fontSize: 48, opacity: .2, marginBottom: 16 }}>🎬</div><div className="mono" style={{ fontSize: 14, color: 'var(--text4)' }}>Select a vibe above</div></div>}
    </div>
  )
}
