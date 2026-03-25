import { useState, useEffect } from 'react'
import { discoverMovies, IMG_THUMB } from '../lib/tmdb'
import { supabase } from '../lib/supabase'
import './TimeBudget.css'

const BUDGETS = [
  { mins: 30,  label: '30 min',  icon: '⚡' },
  { mins: 60,  label: '1 hour',  icon: '🕐' },
  { mins: 90,  label: '90 min',  icon: '🎬' },
  { mins: 120, label: '2 hours', icon: '🎞️' },
  { mins: 150, label: '2.5 hrs', icon: '🍿' },
  { mins: 999, label: 'Epic',    icon: '🏔️' },
]

export default function TimeBudget() {
  const [budget, setBudget] = useState(null)
  const [discover, setDiscover] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(false)

  const selectBudget = async (b) => {
    setBudget(b)
    setLoading(true)

    try {
      // From TMDB discover
      const params = {
        sort_by: 'vote_average.desc',
        'vote_count.gte': 500,
        'vote_average.gte': 6.5,
      }
      if (b.mins < 999) {
        params['with_runtime.lte'] = b.mins
        if (b.mins > 30) params['with_runtime.gte'] = Math.max(20, b.mins - 30)
      } else {
        params['with_runtime.gte'] = 150
      }
      const data = await discoverMovies(params)
      setDiscover((data.results || []).filter(r => r.poster_path).slice(0, 8))

      // From user's watchlist
      const { data: myFilms } = await supabase.from('films').select('*').eq('status', 'watchlist')
      const filtered = (myFilms || []).filter(f => {
        const rt = f.runtime || 100
        return b.mins >= 999 ? rt >= 150 : rt <= b.mins
      })
      setWatchlist(filtered)
    } catch {
      setDiscover([])
      setWatchlist([])
    }
    setLoading(false)
  }

  return (
    <div className="tb-page">
      <div className="tb-header">
        <div className="page-title">Time Budget</div>
        <div className="page-sub">How much time do you have? We'll find something that fits.</div>
      </div>

      <div className="tb-grid">
        {BUDGETS.map(b => (
          <button
            key={b.mins}
            className={`tb-card${budget?.mins === b.mins ? ' active' : ''}`}
            onClick={() => selectBudget(b)}
          >
            <span className="tb-icon">{b.icon}</span>
            <span className="tb-label">{b.label}</span>
          </button>
        ))}
      </div>

      {loading && <div className="tb-loading mono">Finding films that fit your schedule...</div>}

      {!loading && budget && (
        <>
          {watchlist.length > 0 && (
            <div className="tb-section">
              <div className="section-title mono">FROM YOUR WATCHLIST</div>
              <div className="tb-films">
                {watchlist.map(f => (
                  <div key={f.id} className="vibe-film">
                    <div className="vibe-film-poster">
                      {f.poster_path
                        ? <img src={`${IMG_THUMB}${f.poster_path}`} alt={f.title} loading="lazy" />
                        : <div style={{ width: '100%', height: '100%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: 'var(--text4)' }}>{f.title?.charAt(0)}</div>
                      }
                      {f.runtime && <div className="vibe-film-score mono">{f.runtime}m</div>}
                    </div>
                    <div className="vibe-film-info">
                      <div className="vibe-film-title">{f.title}</div>
                      <div className="vibe-film-year mono">{f.release_year}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {discover.length > 0 && (
            <div className="tb-section">
              <div className="section-title mono">DISCOVER — {budget.mins < 999 ? `UNDER ${budget.mins} MIN` : '150+ MIN EPICS'}</div>
              <div className="tb-films">
                {discover.map(f => (
                  <div key={f.id} className="vibe-film">
                    <div className="vibe-film-poster">
                      <img src={`${IMG_THUMB}${f.poster_path}`} alt={f.title} loading="lazy" />
                      <div className="vibe-film-score mono">{f.vote_average?.toFixed(1)}</div>
                    </div>
                    <div className="vibe-film-info">
                      <div className="vibe-film-title">{f.title}</div>
                      <div className="vibe-film-year mono">{f.release_date?.split('-')[0]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
