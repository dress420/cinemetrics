// OMDb liefert IMDb-, Rotten-Tomatoes- und Metacritic-Werte.
// Fallback-Key, falls die Vercel-Umgebungsvariable fehlt (VITE_-Variablen landen ohnehin im Browser-Bundle).
const API_KEY = import.meta.env.VITE_OMDB_API_KEY || '4bf18090'
const CACHE_PREFIX = 'omdb:v2:'
const CACHE_DAYS = 7

const readCache = (key) => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const { t, v, d } = JSON.parse(raw)
    if (Date.now() - t > (d || CACHE_DAYS) * 864e5) return null
    return v
  } catch { return null }
}
const writeCache = (key, v, days) => {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), v, d: days })) } catch {}
}

// Ungültiger Key oder Tageslimit: ein paar Minuten lang nicht weiter anfragen (schont das Kontingent)
let outage = null

const num = (v) => (v && v !== 'N/A' ? parseFloat(String(v).replace(/,/g, '')) : null)

/**
 * Holt Bewertungen — bevorzugt über die IMDb-ID (exakt), sonst über Titel + Jahr.
 * Gibt immer ein Objekt zurück; bei Problemen steht der Grund in `error`.
 */
export async function getOMDBData({ imdbId, title, year, type } = {}) {
  const cacheKey = imdbId || `${title}|${year}|${type || ''}`
  const cached = readCache(cacheKey)
  if (cached) return cached
  if (outage && Date.now() < outage.until) return { error: outage.error }

  const url = new URL('https://www.omdbapi.com/')
  url.searchParams.set('apikey', API_KEY)
  if (imdbId) {
    url.searchParams.set('i', imdbId)
  } else if (title) {
    url.searchParams.set('t', title)
    if (year) url.searchParams.set('y', year)
    if (type) url.searchParams.set('type', type === 'tv' ? 'series' : 'movie')
  } else {
    return { error: 'missing-id' }
  }

  try {
    const res = await fetch(url)
    const data = await res.json().catch(() => ({}))
    if (data.Response === 'False' || !res.ok) {
      const msg = String(data.Error || res.status)
      const error = /api key/i.test(msg) ? 'invalid-key'
        : /limit/i.test(msg) ? 'limit'
        : !data.Error ? 'network'
        : 'not-found'
      if (error === 'invalid-key' || error === 'limit') outage = { error, until: Date.now() + 5 * 60e3 }
      // Exakte ID ohne Treffer: einen Tag merken, statt bei jeder Rangliste neu zu fragen
      else if (imdbId) writeCache(cacheKey, { error }, 1)
      return { error }
    }
    const rating = (src) => (data.Ratings || []).find(r => r.Source === src)?.Value
    const result = {
      imdbId: data.imdbID || imdbId || null,
      imdbRating: num(data.imdbRating),
      imdbVotes: data.imdbVotes !== 'N/A' ? data.imdbVotes : null,
      rtRating: rating('Rotten Tomatoes') ? parseInt(rating('Rotten Tomatoes')) : null,
      metacritic: num(data.Metascore),
      rated: data.Rated !== 'N/A' ? data.Rated : null,
      awards: data.Awards && data.Awards !== 'N/A' ? data.Awards : null,
      boxOffice: data.BoxOffice && data.BoxOffice !== 'N/A' ? data.BoxOffice : null,
    }
    writeCache(cacheKey, result)
    return result
  } catch {
    return { error: 'network' }
  }
}
