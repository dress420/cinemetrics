import { useState, useEffect, useRef } from 'react'
import { X, Star, Check, Plus, ExternalLink, Play } from 'lucide-react'
import { getMovie, getTVShow, IMG_THUMB, IMG_BACKDROP } from '../lib/tmdb'
import { getOMDBData } from '../lib/omdb'
import { supabase } from '../lib/supabase'
import './FilmDetailPanel.css'

const scoreClass = (val, max = 10) => {
  const pct = (val / max) * 100
  return pct >= 75 ? 'high' : pct >= 55 ? 'mid' : 'low'
}

export default function FilmDetailPanel({ film, onClose, onAdd, onOpenFilm }) {
  const [details, setDetails] = useState(null)
  const [omdb, setOmdb] = useState(null)
  const [inLib, setInLib] = useState(false)
  const [loading, setLoading] = useState(true)
  const panelRef = useRef(null)
  const reqId = useRef(0)

  const id = film?.id || film?.tmdb_id
  const type = film?.media_type || 'movie'

  useEffect(() => {
    if (!film) return
    const rid = ++reqId.current
    setLoading(true)
    setDetails(null)
    setOmdb(null)
    setInLib(false)
    panelRef.current?.scrollTo(0, 0)

    ;(async () => {
      try {
        const d = type === 'tv' ? await getTVShow(id) : await getMovie(id)
        if (rid !== reqId.current) return
        setDetails(d)
        setLoading(false)

        const imdbId = d.imdb_id || d.external_ids?.imdb_id || null
        const [o, lib] = await Promise.all([
          getOMDBData({
            imdbId,
            title: d.title || d.name,
            year: (d.release_date || d.first_air_date || '').split('-')[0],
            type,
          }),
          supabase.from('films').select('id').eq('tmdb_id', id).maybeSingle(),
        ])
        if (rid !== reqId.current) return
        setOmdb(o)
        setInLib(!!lib?.data)
      } catch {
        if (rid === reqId.current) setLoading(false)
      }
    })()
  }, [id, type])

  // Escape schließt das Panel
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!film) return null

  const title = details?.title || details?.name || film.title || film.name
  const releaseDate = details?.release_date || details?.first_air_date || ''
  const year = releaseDate.split('-')[0]
  const backdrop = details?.backdrop_path || film.backdrop_path
  const posterPath = details?.poster_path || film.poster_path
  const genres = (details?.genres || []).map(g => g.name)
  const cast = (details?.credits?.cast || []).slice(0, 10)
  const director = (details?.credits?.crew || []).find(c => c.job === 'Director')
    || (details?.created_by || [])[0]
  const similar = (details?.similar?.results || []).filter(s => s.poster_path).slice(0, 9)
  const imdbId = omdb?.imdbId || details?.imdb_id || details?.external_ids?.imdb_id
  const trailer = (details?.videos?.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer')
    || (details?.videos?.results || []).find(v => v.site === 'YouTube')
  const runtime = details?.runtime || details?.episode_run_time?.[0]

  const scores = []
  if (details?.vote_average) scores.push({ label: 'TMDB', value: details.vote_average.toFixed(1), cls: scoreClass(details.vote_average) })
  if (omdb?.imdbRating) scores.push({ label: 'IMDb', value: omdb.imdbRating.toFixed(1), cls: scoreClass(omdb.imdbRating), sub: omdb.imdbVotes })
  if (omdb?.rtRating != null) scores.push({ label: 'Rotten Tomatoes', value: `${omdb.rtRating}%`, cls: scoreClass(omdb.rtRating, 100) })
  if (omdb?.metacritic) scores.push({ label: 'Metacritic', value: omdb.metacritic, cls: scoreClass(omdb.metacritic, 100) })

  const omdbNote =
    omdb?.error === 'invalid-key' ? 'IMDb/RT scores unavailable — the OMDb API key is invalid.'
    : omdb?.error === 'limit' ? 'IMDb/RT scores paused — daily OMDb limit reached.'
    : null

  const facts = [
    runtime && { k: 'Runtime', v: `${runtime} min` },
    releaseDate && { k: 'Released', v: new Date(releaseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
    director && { k: type === 'tv' ? 'Created by' : 'Director', v: director.name },
    omdb?.rated && { k: 'Rated', v: omdb.rated },
    details?.number_of_seasons && { k: 'Seasons', v: details.number_of_seasons },
    omdb?.boxOffice && { k: 'Box office', v: omdb.boxOffice },
  ].filter(Boolean)

  const openOther = (s) => onOpenFilm?.({ ...s, media_type: s.media_type || type })

  return (
    <div className="fdp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <aside className="fdp-panel" ref={panelRef} role="dialog" aria-label={title}>
        <div className="fdp-toolbar">
          <button className="fdp-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="fdp-backdrop">
          {backdrop
            ? <img src={`${IMG_BACKDROP}${backdrop}`} alt="" />
            : <div className="fdp-backdrop-empty" />}
          <div className="fdp-backdrop-fade" />
        </div>

        <div className="fdp-content">
          <div className="fdp-top">
            {posterPath && <img className="fdp-poster" src={`${IMG_THUMB}${posterPath}`} alt="" />}
            <div className="fdp-header">
              <div className="fdp-kicker">{type === 'tv' ? 'Series' : 'Film'}{year && ` · ${year}`}</div>
              <h2 className="fdp-title">{title}</h2>
              {details?.tagline && <div className="fdp-tagline">{details.tagline}</div>}
              {genres.length > 0 && (
                <div className="fdp-genres">{genres.map(g => <span key={g} className="tag">{g}</span>)}</div>
              )}
            </div>
          </div>

          <div className="fdp-section">
            <div className="fdp-section-title">Ratings</div>
            {loading ? (
              <div className="fdp-scores">{[0, 1, 2].map(i => <div key={i} className="fdp-score-card fdp-skel" />)}</div>
            ) : (
              <div className="fdp-scores">
                {scores.map(s => (
                  <div key={s.label} className={`fdp-score-card ${s.cls}`}>
                    <div className="fdp-score-val">{s.value}</div>
                    <div className="fdp-score-label">{s.label}</div>
                  </div>
                ))}
                {!omdb && <div className="fdp-score-card fdp-skel" aria-label="Loading more ratings" />}
              </div>
            )}
            {omdbNote && <div className="fdp-note">{omdbNote}</div>}
          </div>

          {(imdbId || trailer) && (
            <div className="fdp-links">
              {trailer && (
                <a className="fdp-link" href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noreferrer">
                  <Play size={14} fill="currentColor" strokeWidth={0} /> Trailer
                </a>
              )}
              {imdbId && (
                <a className="fdp-link imdb" href={`https://www.imdb.com/title/${imdbId}/`} target="_blank" rel="noreferrer">
                  IMDb <ExternalLink size={13} />
                </a>
              )}
              {details?.homepage && (
                <a className="fdp-link" href={details.homepage} target="_blank" rel="noreferrer">
                  Website <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}

          {details?.overview && (
            <div className="fdp-section">
              <div className="fdp-section-title">Overview</div>
              <p className="fdp-overview">{details.overview}</p>
            </div>
          )}

          {facts.length > 0 && (
            <dl className="fdp-facts">
              {facts.map(f => (
                <div key={f.k} className="fdp-fact"><dt>{f.k}</dt><dd>{f.v}</dd></div>
              ))}
            </dl>
          )}

          {cast.length > 0 && (
            <div className="fdp-section">
              <div className="fdp-section-title">Cast</div>
              <div className="fdp-cast">
                {cast.map(c => (
                  <div key={c.id} className="fdp-cast-item">
                    {c.profile_path
                      ? <img src={`${IMG_THUMB}${c.profile_path}`} alt="" className="fdp-cast-img" loading="lazy" />
                      : <div className="fdp-cast-placeholder">{c.name?.charAt(0)}</div>}
                    <div className="fdp-cast-name">{c.name}</div>
                    <div className="fdp-cast-char">{c.character}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {omdb?.awards && (
            <div className="fdp-section">
              <div className="fdp-section-title">Awards</div>
              <div className="fdp-awards">{omdb.awards}</div>
            </div>
          )}

          {similar.length > 0 && (
            <div className="fdp-section">
              <div className="fdp-section-title">More like this</div>
              <div className="fdp-similar">
                {similar.map(s => (
                  <button key={s.id} className="fdp-similar-card" onClick={() => openOther(s)}>
                    <img src={`${IMG_THUMB}${s.poster_path}`} alt="" loading="lazy" />
                    <span className="fdp-similar-title">{s.title || s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="fdp-actions">
            {inLib ? (
              <div className="fdp-in-lib"><Check size={16} /> In your library</div>
            ) : (
              <button className="btn-primary fdp-add-btn" onClick={() => onAdd && onAdd({
                ...film,
                id,
                tmdb_id: id, // AddFilmModal speichert über tmdb_id — fehlte vorher
                title,
                poster_path: posterPath,
                backdrop_path: backdrop,
                overview: details?.overview,
                release_year: year ? parseInt(year) : null,
                genres,
                runtime,
                vote_average: details?.vote_average,
                media_type: type,
              })}>
                <Plus size={17} strokeWidth={2.5} /> Add to library
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
