import { IMG_THUMB } from '../lib/tmdb'
import './MiniCard.css'

export default function MiniCard({ film }) {
  const title = film.title || film.name
  const year = film.release_year || (film.release_date || film.first_air_date || '').split('-')[0]
  const poster = film.poster_path ? `${IMG_THUMB}${film.poster_path}` : null
  const score = film.vote_average

  const handleClick = () => {
    if (window.__cinemetrics_openfilm) {
      window.__cinemetrics_openfilm({
        id: film.id || film.tmdb_id,
        tmdb_id: film.tmdb_id || film.id,
        title,
        poster_path: film.poster_path,
        backdrop_path: film.backdrop_path,
        media_type: film.media_type || 'movie',
        overview: film.overview,
      })
    }
  }

  return (
    <div className="mc" onClick={handleClick}>
      <div className="mc-poster">
        {poster ? (
          <img src={poster} alt={title} loading="lazy" />
        ) : (
          <div className="mc-no-poster">{title?.charAt(0)}</div>
        )}
        {score > 0 && (
          <div className="mc-score mono">{typeof score === 'number' ? score.toFixed(1) : score}</div>
        )}
      </div>
      <div className="mc-info">
        <div className="mc-title">{title}</div>
        <div className="mc-year mono">{year}</div>
      </div>
    </div>
  )
}
