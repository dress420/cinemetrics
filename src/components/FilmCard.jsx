import { IMG_THUMB } from '../lib/tmdb'
import './FilmCard.css'

const STATUS_MAP = {
  seen: 'Seen',
  watching: 'Watching',
  watchlist: 'Watchlist',
  dropped: 'Dropped',
  rewatch: 'Rewatch',
}

export default function FilmCard({ film, onClick }) {
  const poster = film.poster_path ? `${IMG_THUMB}${film.poster_path}` : null

  return (
    <div className="film-card" onClick={() => onClick && onClick(film)}>
      <div className="film-poster">
        {poster ? (
          <img src={poster} alt={film.title} loading="lazy" />
        ) : (
          <div className="film-no-poster">{film.title?.charAt(0) || '?'}</div>
        )}
        {film.user_rating && (
          <div className="film-badge">{film.user_rating}</div>
        )}
        {film.status && (
          <div className={`film-status-tag ${film.status}`}>
            {STATUS_MAP[film.status] || film.status}
          </div>
        )}
      </div>
      <div className="film-info">
        <div className="film-title">{film.title}</div>
        <div className="film-meta">
          {film.release_year} · {film.media_type === 'tv' ? 'Series' : 'Film'}
        </div>
      </div>
    </div>
  )
}
