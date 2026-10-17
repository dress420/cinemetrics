import { useState, useEffect, useRef } from 'react'
import { Search, Star } from 'lucide-react'
import { searchMulti, IMG_THUMB } from '../lib/tmdb'
import './QuickSearch.css'

export default function QuickSearch({ onClose, onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef()
  const timerRef = useRef()

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSearch = (e) => {
    const q = e.target.value
    setQuery(q)
    setActive(0)
    clearTimeout(timerRef.current)
    if (q.length < 2) { setResults([]); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      const data = await searchMulti(q)
      setResults((data.results || []).filter(r => r.media_type !== 'person').slice(0, 8))
      setLoading(false)
    }, 300)
  }

  const handleKey = (e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter' && results[active]) { onSelect(results[active]); onClose() }
  }

  return (
    <div className="qs-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="qs-modal" onKeyDown={handleKey}>
        <div className="qs-input-wrap">
          <span className="qs-icon"><Search size={18} /></span>
          <input
            ref={inputRef}
            value={query}
            onChange={handleSearch}
            placeholder="Search films, series, people..."
            className="qs-input"
          />
          <kbd className="qs-kbd" onClick={onClose}>ESC</kbd>
        </div>
        {results.length > 0 && (
          <div className="qs-results">
            {results.map((r, i) => (
              <div
                key={r.id}
                className={`qs-item${i === active ? ' active' : ''}`}
                onClick={() => { onSelect(r); onClose() }}
                onMouseEnter={() => setActive(i)}
              >
                {r.poster_path
                  ? <img className="qs-thumb" src={`${IMG_THUMB}${r.poster_path}`} alt="" />
                  : <div className="qs-no-thumb">{(r.title || r.name)?.charAt(0)}</div>
                }
                <div className="qs-info">
                  <div className="qs-title">{r.title || r.name}</div>
                  <div className="qs-meta mono">
                    {r.media_type === 'tv' ? 'Series' : 'Film'} · {(r.release_date || r.first_air_date || '').split('-')[0]}
                    {r.vote_average ? <> · <Star size={10} fill="currentColor" strokeWidth={0} className="qs-star" /> {r.vote_average.toFixed(1)}</> : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {query.length >= 2 && results.length === 0 && !loading && (
          <div className="qs-empty mono">No results for "{query}"</div>
        )}
        {loading && <div className="qs-empty mono">Searching...</div>}
      </div>
    </div>
  )
}
