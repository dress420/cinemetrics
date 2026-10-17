import { useState } from 'react'
import { CloudRain, Sun, Zap, BookOpen, Eye, Droplets, Heart, Moon, Gem, Palette, Brain, Rocket, TriangleAlert, Laugh, WandSparkles } from 'lucide-react'
import { discoverMovies } from '../lib/tmdb'
import MiniCard from '../components/MiniCard'
import './Vibes.css'

const VIBES = [
  { key: 'rainy',       icon: CloudRain, label: 'Rainy Day',              genres: '18',        sort: 'vote_average.desc', voteGte: 500 },
  { key: 'feelgood',    icon: Sun, label: 'Feel Good',              genres: '35,10751',  sort: 'popularity.desc',   voteGte: 500 },
  { key: 'mindblowing', icon: Zap, label: 'Mind-Blowing Ending',    genres: '53,9648',   sort: 'vote_average.desc', voteGte: 500 },
  { key: 'truestory',   icon: BookOpen, label: 'Based on True Story',    genres: '18,36',     sort: 'popularity.desc',   voteGte: 200 },
  { key: 'cantlook',    icon: Eye, label: "Can't Look Away",        genres: '53,27',     sort: 'vote_average.desc', voteGte: 500 },
  { key: 'cry',         icon: Droplets, label: 'Cry Your Eyes Out',      genres: '18,10749',  sort: 'vote_average.desc', voteGte: 500 },
  { key: 'datenight',   icon: Heart, label: 'Date Night',             genres: '35,10749',  sort: 'popularity.desc',   voteGte: 300 },
  { key: 'alone3am',    icon: Moon, label: 'Watch Alone at 3am',     genres: '27,9648',   sort: 'vote_average.desc', voteGte: 200 },
  { key: 'underrated',  icon: Gem, label: 'Underrated Masterpiece', genres: '18',        sort: 'vote_average.desc', voteGte: 50,  voteLte: 500 },
  { key: 'style',       icon: Palette, label: 'Style over Substance',   genres: '878,28',    sort: 'popularity.desc',   voteGte: 200 },
  { key: 'thinking',    icon: Brain, label: 'Thought-Provoking',      genres: '878,18',    sort: 'vote_average.desc', voteGte: 500 },
  { key: 'escapism',    icon: Rocket, label: 'Pure Escapism',          genres: '12,14,28',  sort: 'popularity.desc',   voteGte: 500 },
  { key: 'disturbing',  icon: TriangleAlert, label: 'Disturbing but Important', genres: '18,10752', sort: 'vote_average.desc', voteGte: 300 },
  { key: 'laugh',       icon: Laugh, label: 'Laugh until you cry',    genres: '35',        sort: 'popularity.desc',   voteGte: 1000 },
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
            <span className="vibe-emoji"><v.icon size={22} strokeWidth={1.6} /></span>
            <span className="vibe-label">{v.label}</span>
          </button>
        ))}
      </div>
      {loading && <div className="vibes-loading mono">Finding your vibe...</div>}
      {!loading && selected && films.length > 0 && (
        <>
          <div className="vibes-results-header">
            <span className="vibes-results-emoji"><selected.icon size={20} strokeWidth={1.75} /></span>
            <span className="vibes-results-title">{selected.label}</span>
          </div>
          <div className="mc-grid">{films.map(f => <MiniCard key={f.id} film={f} />)}</div>
        </>
      )}
      {!selected && <div className="empty-state"><div className="empty-state-icon"><WandSparkles size={24} strokeWidth={1.6} /></div><div className="empty-state-title">Pick a vibe</div><div className="empty-state-sub">We'll match films to your mood</div></div>}
    </div>
  )
}
