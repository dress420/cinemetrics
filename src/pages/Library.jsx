import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import FilmCard from '../components/FilmCard'
import './Library.css'

const FILTERS = [
  { value: 'all',       label: 'All' },
  { value: 'seen',      label: 'Seen' },
  { value: 'watching',  label: 'Watching' },
  { value: 'watchlist', label: 'Watchlist' },
  { value: 'dropped',   label: 'Dropped' },
  { value: 'rewatch',   label: 'Rewatch' },
]

export default function Library({ onAddFilm, refreshKey }) {
  const [films, setFilms]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort]     = useState('newest')

  useEffect(() => {
    loadFilms()
  }, [refreshKey])

  const loadFilms = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('films')
      .select('*')
      .order('created_at', { ascending: false })
    setFilms(data || [])
    setLoading(false)
  }

  const countFor = (status) =>
    status === 'all' ? films.length : films.filter((f) => f.status === status).length

  const filtered = useMemo(() => {
    let list = [...films]
    if (filter !== 'all') list = list.filter((f) => f.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((f) => f.title?.toLowerCase().includes(q))
    }
    switch (sort) {
      case 'rating':  list.sort((a, b) => (b.user_rating || 0) - (a.user_rating || 0)); break
      case 'title':   list.sort((a, b) => a.title.localeCompare(b.title)); break
      case 'year':    list.sort((a, b) => (b.release_year || 0) - (a.release_year || 0)); break
      default:        break
    }
    return list
  }, [films, filter, search, sort])

  return (
    <div className="library">
      <div className="lib-topbar">
        <div>
          <div className="page-title">My Library</div>
          <div className="page-sub">{films.length} titles logged</div>
        </div>
        <button className="btn-primary" onClick={onAddFilm}>+ Add Film</button>
      </div>

      <div className="lib-controls">
        <div className="filter-row">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-btn${filter === f.value ? ' active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              <span className="filter-count">{countFor(f.value)}</span>
            </button>
          ))}
        </div>
        <div className="lib-right">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search library..."
          />
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="rating">Highest Rated</option>
            <option value="title">A – Z</option>
            <option value="year">Release Year</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="lib-loading">Loading your library...</div>
      ) : filtered.length === 0 ? (
        <div className="lib-empty">
          <div className="lib-empty-icon">◈</div>
          <div className="lib-empty-title">Nothing here yet</div>
          <div className="lib-empty-sub">
            {search ? 'No results for that search' : 'Add your first film to get started'}
          </div>
          {!search && (
            <button className="btn-primary" onClick={onAddFilm}>+ Add Film</button>
          )}
        </div>
      ) : (
        <div className="library-grid">
          {filtered.map((f) => <FilmCard key={f.id} film={f} />)}
        </div>
      )}
    </div>
  )
}
