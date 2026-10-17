import { useState } from 'react'
import { Zap, Clock, Film, Clapperboard, Popcorn, Mountain, Timer } from 'lucide-react'
import { discoverMovies } from '../lib/tmdb'
import { supabase } from '../lib/supabase'
import MiniCard from '../components/MiniCard'
import './TimeBudget.css'

const BUDGETS = [
  { mins: 30,  label: '30 min',  icon: Zap },
  { mins: 60,  label: '1 hour',  icon: Clock },
  { mins: 90,  label: '90 min',  icon: Film },
  { mins: 120, label: '2 hours', icon: Clapperboard },
  { mins: 150, label: '2.5 hrs', icon: Popcorn },
  { mins: 999, label: 'Epic',    icon: Mountain },
]

export default function TimeBudget() {
  const [budget, setBudget] = useState(null)
  const [discover, setDiscover] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(false)

  const selectBudget = async (b) => {
    setBudget(b); setLoading(true)
    try {
      const params = { sort_by: 'vote_average.desc', 'vote_count.gte': 500, 'vote_average.gte': 6.5 }
      if (b.mins < 999) { params['with_runtime.lte'] = b.mins; if (b.mins > 30) params['with_runtime.gte'] = Math.max(20, b.mins - 30) }
      else params['with_runtime.gte'] = 150
      const data = await discoverMovies(params)
      setDiscover((data.results || []).filter(r => r.poster_path).slice(0, 16))
      const { data: myFilms } = await supabase.from('films').select('*').eq('status', 'watchlist')
      setWatchlist((myFilms || []).filter(f => { const rt = f.runtime || 100; return b.mins >= 999 ? rt >= 150 : rt <= b.mins }))
    } catch { setDiscover([]); setWatchlist([]) }
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
          <button key={b.mins} className={`tb-card${budget?.mins === b.mins ? ' active' : ''}`} onClick={() => selectBudget(b)}>
            <span className="tb-icon"><b.icon size={22} strokeWidth={1.6} /></span><span className="tb-label">{b.label}</span>
          </button>
        ))}
      </div>
      {loading && <div className="tb-loading mono">Finding films that fit your schedule...</div>}
      {!budget && !loading && <div className="empty-state"><div className="empty-state-icon"><Timer size={24} strokeWidth={1.6} /></div><div className="empty-state-title">How much time do you have?</div><div className="empty-state-sub">Pick a length above</div></div>}
      {!loading && budget && (<>
        {watchlist.length > 0 && <div className="tb-section"><div className="section-title mono">FROM YOUR WATCHLIST</div><div className="mc-grid">{watchlist.map(f => <MiniCard key={f.id} film={f} />)}</div></div>}
        {discover.length > 0 && <div className="tb-section"><div className="section-title mono">DISCOVER — {budget.mins < 999 ? `UNDER ${budget.mins} MIN` : '150+ MIN EPICS'}</div><div className="mc-grid">{discover.map(f => <MiniCard key={f.id} film={f} />)}</div></div>}
      </>)}
    </div>
  )
}
