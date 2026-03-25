import { useState, useEffect } from 'react'
import { getMovie, getTVShow, IMG_BASE, IMG_THUMB } from '../lib/tmdb'
import { getOMDBData } from '../lib/omdb'
import { supabase } from '../lib/supabase'
import './FilmDetailPanel.css'

export default function FilmDetailPanel({ film, onClose, onAdd }) {
  const [details, setDetails] = useState(null)
  const [omdb, setOmdb] = useState(null)
  const [inLib, setInLib] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!film) return
    setLoading(true)
    setDetails(null)
    setOmdb(null)
    loadDetails()
  }, [film?.id])

  const loadDetails = async () => {
    const id = film.id || film.tmdb_id
    const type = film.media_type || 'movie'
    try {
      const d = type === 'tv' ? await getTVShow(id) : await getMovie(id)
      setDetails(d)
      const title = d.title || d.name
      const year = (d.release_date || d.first_air_date || '').split('-')[0]
      const o = await getOMDBData(title, year)
      setOmdb(o)
      const { data } = await supabase.from('films').select('id').eq('tmdb_id', id).single()
      setInLib(!!data)
    } catch {}
    setLoading(false)
  }

  if (!film) return null

  const title = details?.title || details?.name || film.title || film.name
  const year = (details?.release_date || details?.first_air_date || '').split('-')[0]
  const backdropUrl = details?.backdrop_path ? `${IMG_BASE}${details.backdrop_path}` : null
  const posterUrl = (details?.poster_path || film.poster_path) ? `${IMG_THUMB}${details?.poster_path || film.poster_path}` : null
  const genres = (details?.genres || []).map(g => g.name)
  const cast = (details?.credits?.cast || []).slice(0, 6)
  const director = (details?.credits?.crew || []).find(c => c.job === 'Director')
  const similar = (details?.similar?.results || []).filter(s => s.poster_path).slice(0, 6)

  const scoreClass = (val, max = 10) => {
    const pct = (val / max) * 100
    return pct >= 75 ? 'high' : pct >= 50 ? 'mid' : 'low'
  }

  return (
    <div className="fdp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fdp-panel">
        <button className="fdp-close" onClick={onClose}>✕</button>

        {backdropUrl && (
          <div className="fdp-backdrop">
            <img src={backdropUrl} alt="" />
            <div className="fdp-backdrop-fade" />
          </div>
        )}

        <div className="fdp-content">
          <div className="fdp-top">
            {posterUrl && <img className="fdp-poster" src={posterUrl} alt={title} />}
            <div className="fdp-header">
              <h2 className="fdp-title">{title}</h2>
              <div className="fdp-meta mono">
                {year} · {details?.runtime ? `${details.runtime} min` : film.media_type === 'tv' ? 'Series' : 'Film'}
                {details?.vote_average ? ` · ⭐ ${details.vote_average.toFixed(1)}` : ''}
              </div>
              <div className="fdp-genres">
                {genres.map(g => <span key={g} className="tag">{g}</span>)}
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="fdp-section">
            <div className="fdp-section-title mono">RATINGS</div>
            <div className="fdp-scores">
              {details?.vote_average && (
                <div className={`fdp-score-card ${scoreClass(details.vote_average)}`}>
                  <div className="fdp-score-val">{details.vote_average.toFixed(1)}</div>
                  <div className="fdp-score-label">TMDB</div>
                </div>
              )}
              {omdb?.imdbRating && (
                <div className={`fdp-score-card ${scoreClass(omdb.imdbRating)}`}>
                  <div className="fdp-score-val">{omdb.imdbRating}</div>
                  <div className="fdp-score-label">IMDb</div>
                </div>
              )}
              {omdb?.rtRating != null && (
                <div className={`fdp-score-card ${scoreClass(omdb.rtRating, 100)}`}>
                  <div className="fdp-score-val">{omdb.rtRating}%</div>
                  <div className="fdp-score-label">RT</div>
                </div>
              )}
              {omdb?.metacritic && (
                <div className={`fdp-score-card ${scoreClass(omdb.metacritic, 100)}`}>
                  <div className="fdp-score-val">{omdb.metacritic}</div>
                  <div className="fdp-score-label">Metacritic</div>
                </div>
              )}
            </div>
          </div>

          {details?.overview && (
            <div className="fdp-section">
              <div className="fdp-section-title mono">OVERVIEW</div>
              <p className="fdp-overview">{details.overview}</p>
            </div>
          )}

          {director && (
            <div className="fdp-section">
              <div className="fdp-section-title mono">DIRECTOR</div>
              <div className="fdp-director">{director.name}</div>
            </div>
          )}

          {cast.length > 0 && (
            <div className="fdp-section">
              <div className="fdp-section-title mono">CAST</div>
              <div className="fdp-cast">
                {cast.map(c => (
                  <div key={c.id} className="fdp-cast-item">
                    {c.profile_path
                      ? <img src={`${IMG_THUMB}${c.profile_path}`} alt={c.name} className="fdp-cast-img" />
                      : <div className="fdp-cast-placeholder">{c.name?.charAt(0)}</div>
                    }
                    <div className="fdp-cast-name">{c.name}</div>
                    <div className="fdp-cast-char mono">{c.character}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {omdb?.awards && omdb.awards !== 'N/A' && (
            <div className="fdp-section">
              <div className="fdp-section-title mono">AWARDS</div>
              <div className="fdp-awards">{omdb.awards}</div>
            </div>
          )}

          {similar.length > 0 && (
            <div className="fdp-section">
              <div className="fdp-section-title mono">SIMILAR FILMS</div>
              <div className="fdp-similar">
                {similar.map(s => (
                  <div key={s.id} className="fdp-similar-card">
                    <img src={`${IMG_THUMB}${s.poster_path}`} alt={s.title || s.name} />
                    <div className="fdp-similar-title">{s.title || s.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="fdp-actions">
            {inLib ? (
              <div className="fdp-in-lib mono">✓ In your library</div>
            ) : (
              <button className="btn-primary fdp-add-btn" onClick={() => onAdd && onAdd({
                ...film,
                id: film.id || film.tmdb_id,
                title,
                poster_path: details?.poster_path || film.poster_path,
                backdrop_path: details?.backdrop_path || film.backdrop_path,
                overview: details?.overview,
                release_year: year ? parseInt(year) : null,
                genres,
                runtime: details?.runtime,
                vote_average: details?.vote_average,
                media_type: film.media_type || 'movie',
              })}>
                + Add to Library
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
