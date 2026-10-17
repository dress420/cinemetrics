import { useEffect, useRef, useState } from 'react'
import { getOMDBData } from '../lib/omdb'
import { getImdbId, getLetterboxd, providerLinks, summarize } from '../lib/ratings'

/**
 * Lädt die Bewertungen aller Anbieter für einen Film / eine Serie.
 * TMDB ist sofort da (steckt schon in den Listendaten), IMDb/RT/Metacritic kommen über OMDb,
 * Letterboxd über /api/letterboxd. Alles läuft parallel und wird gecacht.
 *
 * @param film   Objekt mit id/tmdb_id, media_type, title/name, release_date, vote_average, vote_count
 * @param opts   { delay } — Verzögerung in ms (z. B. beim schnellen Durchklicken der Liste)
 */
export function useRatings(film, { delay = 0, imdbIdHint = null } = {}) {
  const id = film?.id || film?.tmdb_id
  const type = film?.media_type === 'tv' ? 'tv' : 'movie'
  const title = film?.title || film?.name || ''
  const year = (film?.release_date || film?.first_air_date || String(film?.release_year || '')).slice(0, 4)

  const [omdb, setOmdb] = useState(null)
  const [lb, setLb] = useState(null)
  const [imdbId, setImdbId] = useState(imdbIdHint)
  const [loading, setLoading] = useState({ omdb: true, lb: true })
  const req = useRef(0)

  useEffect(() => {
    if (!id) return
    const rid = ++req.current
    setOmdb(null); setLb(null); setImdbId(imdbIdHint)
    setLoading({ omdb: true, lb: true })
    const alive = () => rid === req.current

    const timer = setTimeout(async () => {
      // Filme: Letterboxd sofort über die TMDB-ID starten (parallel zur IMDb-ID)
      const lbEarly = type === 'movie' ? getLetterboxd({ tmdbId: id, type }) : null

      const tt = imdbIdHint || await getImdbId(id, type)
      if (!alive()) return
      setImdbId(tt)

      const omdbP = getOMDBData({ imdbId: tt, title, year, type }).then(o => {
        if (!alive()) return
        setOmdb(o)
        setLoading(l => ({ ...l, omdb: false }))
      })

      let lbRes = lbEarly ? await lbEarly : null
      // Kein Treffer über TMDB (oder Serie) → nochmal über die IMDb-ID versuchen
      if ((!lbRes || lbRes.error) && tt) lbRes = await getLetterboxd({ imdbId: tt, type })
      if (!alive()) return
      setLb(lbRes)
      setLoading(l => ({ ...l, lb: false }))
      await omdbP
    }, delay)

    return () => { clearTimeout(timer); req.current++ }
  }, [id, type])

  const scores = {
    tmdb: film?.vote_average > 0 ? { value: film.vote_average, count: film.vote_count } : null,
    imdb: omdb?.imdbRating != null ? { value: omdb.imdbRating, count: omdb.imdbVotes } : null,
    rt:   omdb?.rtRating != null ? { value: omdb.rtRating } : null,
    mc:   omdb?.metacritic != null ? { value: omdb.metacritic } : null,
    lb:   lb?.rating != null ? { value: lb.rating, count: lb.count } : null,
  }

  const status = {
    tmdb: 'done',
    imdb: loading.omdb ? 'loading' : omdb?.error === 'invalid-key' || omdb?.error === 'limit' || omdb?.error === 'network' ? 'error' : 'done',
    rt:   loading.omdb ? 'loading' : omdb?.error && omdb.error !== 'not-found' ? 'error' : 'done',
    mc:   loading.omdb ? 'loading' : omdb?.error && omdb.error !== 'not-found' ? 'error' : 'done',
    lb:   loading.lb ? 'loading' : lb?.error === 'unavailable' ? 'error' : 'done',
  }

  return {
    scores,
    status,
    summary: summarize(scores),
    omdb,
    omdbError: omdb?.error || null,
    imdbId: imdbId || omdb?.imdbId || null,
    links: providerLinks({ tmdbId: id, type, imdbId: imdbId || omdb?.imdbId, title, lbUrl: lb?.url }),
    loading: loading.omdb || loading.lb,
  }
}
