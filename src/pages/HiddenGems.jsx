import { useState, useEffect } from 'react'
import { Gem } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { IMG_THUMB } from '../lib/tmdb'
import './HiddenGems.css'

export default function HiddenGems() {
  const [gems, setGems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('films').select('*')
    if (!data) { setLoading(false); return }
    const scored = data
      .filter(f => f.vote_average && f.user_rating)
      .map(f => ({
        ...f,
        gemScore: Math.round(((f.user_rating - f.vote_average) * 10) + (10 - f.vote_average) * 3)
      }))
      .filter(f => f.gemScore > 0)
      .sort((a, b) => b.gemScore - a.gemScore)
    setGems(scored)
    setLoading(false)
  }

  return (
    <div className="gems-page">
      <div className="gems-header">
        <div className="page-title">Hidden Gems</div>
        <div className="page-sub">Films you rated higher than the crowd — your secret treasures</div>
      </div>
      {loading ? (
        <div className="gems-loading">Scanning your vault...</div>
      ) : gems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Gem size={24} strokeWidth={1.6} /></div>
          <div className="empty-state-title">No gems yet</div>
          <div className="empty-state-sub">Rate films to discover your hidden gems</div>
        </div>
      ) : (
        <div className="gems-list">
          {gems.map((f, i) => (
            <div key={f.id} className="gem-item">
              <div className="gem-rank mono">#{i + 1}</div>
              {f.poster_path
                ? <img className="gem-poster" src={`${IMG_THUMB}${f.poster_path}`} alt={f.title} />
                : <div className="gem-no-poster">{f.title?.charAt(0)}</div>
              }
              <div className="gem-info">
                <div className="gem-title">{f.title}</div>
                <div className="gem-year mono">{f.release_year} · {f.media_type === 'tv' ? 'Series' : 'Film'}</div>
                <div className="gem-scores">
                  <span className="gem-score yours">Your rating: {f.user_rating}/10</span>
                  <span className="gem-score crowd">TMDB: {f.vote_average?.toFixed(1)}/10</span>
                </div>
              </div>
              <div className="gem-badge">
                <div className="gem-badge-label mono">GEM SCORE</div>
                <div className="gem-badge-value">+{f.gemScore}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
