import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import FilmCard from '../components/FilmCard'
import './Library.css'

export default function Watchlist({ onAddFilm }) {
  const [films, setFilms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('films').select('*').eq('status', 'watchlist').order('created_at', { ascending: false })
    setFilms(data || [])
    setLoading(false)
  }

  return (
    <div className="library">
      <div className="lib-topbar">
        <div>
          <div className="page-title">Watchlist</div>
          <div className="page-sub">{films.length} films queued up</div>
        </div>
        <button className="btn-primary" onClick={onAddFilm}>+ Add Film</button>
      </div>
      {loading ? <div className="lib-loading">Loading watchlist...</div>
        : films.length === 0 ? (
          <div className="lib-empty">
            <div className="lib-empty-icon">◎</div>
            <div className="lib-empty-title">Watchlist is empty</div>
            <div className="lib-empty-sub">Add films with status "Watchlist"</div>
            <button className="btn-primary" onClick={onAddFilm}>+ Add Film</button>
          </div>
        ) : (
          <div className="library-grid">
            {films.map(f => <FilmCard key={f.id} film={f} />)}
          </div>
        )
      }
    </div>
  )
}
