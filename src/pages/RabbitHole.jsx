import { useState } from 'react'
import { searchMulti, getMovie, getTVShow, IMG_THUMB, IMG_BASE } from '../lib/tmdb'
import './RabbitHole.css'

export default function RabbitHole() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [filmography, setFilmography] = useState([])
  const [loading, setLoading] = useState(false)

  const search = async (e) => {
    const q = e.target.value
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    const data = await searchMulti(q)
    setResults((data.results || []).filter(r => r.media_type === 'person').slice(0, 5))
  }

  const selectPerson = async (person) => {
    setResults([])
    setQuery(person.name)
    setSelected(person)
    setLoading(true)
    try {
      const res = await fetch(`https://api.themoviedb.org/3/person/${person.id}/combined_credits?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`)
      const data = await res.json()
      const credits = [...(data.cast || []), ...(data.crew || [])]
      const unique = [...new Map(credits.map(c => [c.id, c])).values()]
      const sorted = unique
        .filter(c => c.vote_count > 100)
        .sort((a, b) => b.vote_average - a.vote_average)
        .slice(0, 24)
      setFilmography(sorted)
    } catch { setFilmography([]) }
    setLoading(false)
  }

  return (
    <div className="rabbit-page">
      <div className="rabbit-header">
        <div className="page-title">Rabbit Hole</div>
        <div className="page-sub">Explore a director or actor's complete filmography</div>
      </div>

      <div className="rabbit-search">
        <input value={query} onChange={search} placeholder="Search for a director or actor..." autoComplete="off" />
        {results.length > 0 && (
          <div className="rabbit-results">
            {results.map(p => (
              <div key={p.id} className="rabbit-result" onClick={() => selectPerson(p)}>
                {p.profile_path
                  ? <img src={`${IMG_THUMB}${p.profile_path}`} alt={p.name} className="rabbit-avatar" />
                  : <div className="rabbit-avatar-placeholder">{p.name?.charAt(0)}</div>
                }
                <div>
                  <div className="rabbit-result-name">{p.name}</div>
                  <div className="rabbit-result-dept mono">{p.known_for_department}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="rabbit-person-header">
          {selected.profile_path && <img src={`${IMG_THUMB}${selected.profile_path}`} alt={selected.name} className="rabbit-person-img" />}
          <div>
            <div className="rabbit-person-name">{selected.name}</div>
            <div className="rabbit-person-dept mono">{selected.known_for_department} · {filmography.length} titles</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rabbit-loading">Loading filmography...</div>
      ) : filmography.length > 0 ? (
        <div className="rabbit-grid">
          {filmography.map(f => (
            <div key={f.id} className="rabbit-film-card">
              <div className="rabbit-film-poster">
                {f.poster_path
                  ? <img src={`${IMG_THUMB}${f.poster_path}`} alt={f.title || f.name} loading="lazy" />
                  : <div className="rabbit-film-no-poster">{(f.title || f.name)?.charAt(0)}</div>
                }
                <div className="rabbit-film-score mono">{f.vote_average?.toFixed(1)}</div>
              </div>
              <div className="rabbit-film-info">
                <div className="rabbit-film-title">{f.title || f.name}</div>
                <div className="rabbit-film-year mono">{(f.release_date || f.first_air_date || '').split('-')[0]}</div>
              </div>
            </div>
          ))}
        </div>
      ) : selected ? (
        <div className="rabbit-loading">No filmography found</div>
      ) : null}
    </div>
  )
}
