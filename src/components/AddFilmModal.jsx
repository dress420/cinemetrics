import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { searchMulti, getMovie, getTVShow, IMG_THUMB } from '../lib/tmdb'
import { supabase } from '../lib/supabase'
import './AddFilmModal.css'

const STATUSES = [
  { value: 'seen',      label: 'Seen'      },
  { value: 'watching',  label: 'Watching'  },
  { value: 'watchlist', label: 'Watchlist' },
  { value: 'dropped',   label: 'Dropped'   },
  { value: 'rewatch',   label: 'Rewatch'   },
]
const FORMATS = ['Netflix','Prime Video','Disney+','Cinema','Blu-Ray','DVD','Other']

function ScoreComparison({ userRating, tmdbScore }) {
  if (!userRating || !tmdbScore) return null
  const diff = (parseFloat(userRating) - tmdbScore).toFixed(1)
  const isHigher = diff > 0
  const isLower  = diff < 0
  const isSame   = diff == 0

  return (
    <div className="score-compare">
      <div className="score-compare-row">
        <div className="score-compare-item">
          <div className="sc-label">YOUR RATING</div>
          <div className="sc-value" style={{ color: 'var(--accent)' }}>{userRating}</div>
        </div>
        <div className="score-compare-vs">vs</div>
        <div className="score-compare-item">
          <div className="sc-label">TMDB AVG</div>
          <div className="sc-value" style={{ color: 'var(--text2)' }}>{tmdbScore?.toFixed(1)}</div>
        </div>
        <div className={`score-compare-verdict ${isHigher ? 'higher' : isLower ? 'lower' : 'same'}`}>
          {isHigher ? `+${diff} above average` : isLower ? `${diff} below average` : 'Same as average'}
        </div>
      </div>
    </div>
  )
}

export default function AddFilmModal({ onClose, onAdded, preselect }) {
  const [query,    setQuery]    = useState(preselect ? (preselect.title || preselect.name) : '')
  const [results,  setResults]  = useState([])
  const [selected, setSelected] = useState(preselect || null)
  const [status,   setStatus]   = useState('seen')
  const [rating,   setRating]   = useState('')
  const [reaction, setReaction] = useState('')
  const [format,   setFormat]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const handleSearch = async (e) => {
    const q = e.target.value
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    const data = await searchMulti(q)
    setResults((data.results || []).filter(r => r.media_type !== 'person').slice(0, 6))
    setLoading(false)
  }

  const handleSelect = async (item) => {
    setResults([])
    setQuery(item.title || item.name)
    setSelected(null)
    try {
      const details = item.media_type === 'tv' ? await getTVShow(item.id) : await getMovie(item.id)
      const releaseDate = details.release_date || details.first_air_date || ''
      setSelected({
        tmdb_id:      item.id,
        title:        item.title || item.name,
        poster_path:  item.poster_path || null,
        backdrop_path:item.backdrop_path || null,
        overview:     details.overview || '',
        release_year: releaseDate ? parseInt(releaseDate.split('-')[0]) : null,
        genres:       (details.genres || []).map(g => g.name),
        runtime:      details.runtime || null,
        vote_average: details.vote_average || null,
        media_type:   item.media_type || 'movie',
      })
    } catch { setError('Could not load film details.') }
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true); setError('')
    const { error: err } = await supabase.from('films').upsert({
      tmdb_id:       selected.tmdb_id,
      title:         selected.title,
      poster_path:   selected.poster_path,
      backdrop_path: selected.backdrop_path,
      overview:      selected.overview,
      release_year:  selected.release_year,
      genres:        selected.genres,
      runtime:       selected.runtime,
      vote_average:  selected.vote_average,
      media_type:    selected.media_type,
      status,
      user_rating:   rating ? parseFloat(rating) : null,
      first_reaction:reaction || null,
      format_tag:    format || null,
      watched_date:  status === 'seen' ? new Date().toISOString() : null,
    }, { onConflict: 'tmdb_id' })
    setSaving(false)
    if (err) { setError(err.message); return }
    onAdded && onAdded()
    onClose()
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="badge">ADD FILM / SERIES</div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        {!preselect && (
          <div className="search-box" style={{ marginTop: 18 }}>
            <input value={query} onChange={handleSearch} placeholder="Search for a film or series..." autoFocus />
            {loading && <div className="search-hint mono">Searching...</div>}
            {results.length > 0 && (
              <div className="search-results">
                {results.map(r => (
                  <div key={r.id} className="search-result-item" onClick={() => handleSelect(r)}>
                    {r.poster_path
                      ? <img className="result-poster" src={`${IMG_THUMB}${r.poster_path}`} alt={r.title || r.name} />
                      : <div className="result-no-img">{(r.title || r.name)?.charAt(0)}</div>
                    }
                    <div>
                      <div className="result-title">{r.title || r.name}</div>
                      <div className="result-meta mono">{r.media_type === 'tv' ? 'Series' : 'Film'} · {(r.release_date || r.first_air_date || '').split('-')[0]}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selected && (
          <div className="selected-film">
            <div className="selected-header">
              {selected.poster_path && (
                <img className="selected-poster" src={`${IMG_THUMB}${selected.poster_path}`} alt={selected.title} />
              )}
              <div>
                <div className="selected-title">{selected.title}</div>
                <div className="selected-sub">{selected.release_year} · {selected.media_type === 'tv' ? 'Series' : 'Film'}</div>
                {selected.vote_average && <div className="selected-score">TMDB {selected.vote_average.toFixed(1)} / 10</div>}
                <div className="selected-genres">
                  {selected.genres?.map(g => <span key={g} className="tag">{g}</span>)}
                </div>
              </div>
            </div>

            <div className="form-fields">
              <div className="form-field">
                <label>STATUS</label>
                <div className="status-options">
                  {STATUSES.map(s => (
                    <button key={s.value} className={`status-btn${status === s.value ? ' active' : ''}`} onClick={() => setStatus(s.value)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>YOUR RATING (0–10)</label>
                  <input
                    type="number" min="0" max="10" step="0.5"
                    value={rating} onChange={e => setRating(e.target.value)}
                    placeholder="e.g. 9.5"
                  />
                </div>
                <div className="form-field">
                  <label>FORMAT</label>
                  <select value={format} onChange={e => setFormat(e.target.value)}>
                    <option value="">Select...</option>
                    {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {/* Score Comparison */}
              <ScoreComparison userRating={rating} tmdbScore={selected.vote_average} />

              <div className="form-field">
                <label>FIRST REACTION</label>
                <textarea value={reaction} onChange={e => setReaction(e.target.value)} placeholder="How did you feel right after watching?" rows={2} />
              </div>
            </div>

            {error && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 10, fontFamily: 'var(--mono)' }}>{error}</div>}
            <button className="btn-primary save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : <><Plus size={17} strokeWidth={2.5} /> Add to CineMetrics</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
