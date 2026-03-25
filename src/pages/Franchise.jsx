import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { IMG_THUMB } from '../lib/tmdb'
import './Franchise.css'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY

export default function Franchise() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [collection, setCollection] = useState(null)
  const [myTmdbIds, setMyTmdbIds] = useState(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('films').select('tmdb_id').then(({ data }) => {
      setMyTmdbIds(new Set((data || []).map(f => f.tmdb_id)))
    })
  }, [])

  const search = async (e) => {
    const q = e.target.value
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    const res = await fetch(`https://api.themoviedb.org/3/search/collection?api_key=${API_KEY}&query=${encodeURIComponent(q)}`)
    const data = await res.json()
    setResults((data.results || []).slice(0, 6))
  }

  const selectCollection = async (col) => {
    setResults([])
    setQuery(col.name)
    setLoading(true)
    try {
      const res = await fetch(`https://api.themoviedb.org/3/collection/${col.id}?api_key=${API_KEY}`)
      const data = await res.json()
      const sorted = (data.parts || []).sort((a, b) => {
        const da = a.release_date || '9999'
        const db = b.release_date || '9999'
        return da.localeCompare(db)
      })
      setCollection({ ...data, parts: sorted })
    } catch { setCollection(null) }
    setLoading(false)
  }

  const seen = collection ? collection.parts.filter(p => myTmdbIds.has(p.id)).length : 0
  const total = collection ? collection.parts.length : 0
  const pct = total ? Math.round((seen / total) * 100) : 0

  const addToWatchlist = async (film) => {
    await supabase.from('films').upsert({
      tmdb_id: film.id,
      title: film.title,
      poster_path: film.poster_path,
      backdrop_path: film.backdrop_path,
      overview: film.overview,
      release_year: film.release_date ? parseInt(film.release_date.split('-')[0]) : null,
      genres: [],
      vote_average: film.vote_average,
      media_type: 'movie',
      status: 'watchlist',
    }, { onConflict: 'tmdb_id' })
    setMyTmdbIds(prev => new Set([...prev, film.id]))
  }

  return (
    <div className="fr-page">
      <div className="fr-header">
        <div className="page-title">Franchise Tracker</div>
        <div className="page-sub">Track your progress through film franchises.</div>
      </div>

      <div className="fr-search">
        <input value={query} onChange={search} placeholder="Search franchises (Marvel, Star Wars, Bond...)" autoComplete="off" />
        {results.length > 0 && (
          <div className="fr-results">
            {results.map(r => (
              <div key={r.id} className="fr-result" onClick={() => selectCollection(r)}>
                {r.poster_path
                  ? <img src={`${IMG_THUMB}${r.poster_path}`} alt={r.name} className="fr-result-img" />
                  : <div className="fr-result-placeholder">{r.name?.charAt(0)}</div>
                }
                <div className="fr-result-name">{r.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && <div className="fr-loading mono">Loading franchise...</div>}

      {!loading && collection && (
        <>
          <div className="fr-progress-card">
            <div className="fr-progress-top">
              <div className="fr-progress-title">{collection.name}</div>
              <div className="fr-progress-count mono">{seen}/{total} seen</div>
            </div>
            <div className="fr-progress-bar">
              <div className="fr-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="fr-progress-pct mono">{pct}% complete</div>
          </div>

          <div className="fr-timeline">
            {collection.parts.map((p, i) => {
              const isSeen = myTmdbIds.has(p.id)
              return (
                <div key={p.id} className={`fr-film${isSeen ? ' seen' : ''}`}>
                  <div className="fr-film-num mono">#{i + 1}</div>
                  <div className="fr-film-poster">
                    {p.poster_path
                      ? <img src={`${IMG_THUMB}${p.poster_path}`} alt={p.title} />
                      : <div className="fr-film-no-poster">{p.title?.charAt(0)}</div>
                    }
                    {isSeen && <div className="fr-seen-badge">✓</div>}
                  </div>
                  <div className="fr-film-info">
                    <div className="fr-film-title">{p.title}</div>
                    <div className="fr-film-year mono">{p.release_date?.split('-')[0] || '—'}</div>
                    {p.vote_average > 0 && <div className="fr-film-score mono">⭐ {p.vote_average.toFixed(1)}</div>}
                  </div>
                  {!isSeen && (
                    <button className="fr-add-btn" onClick={() => addToWatchlist(p)} title="Add to watchlist">+</button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
