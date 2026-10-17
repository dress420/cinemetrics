// Alles rund um die Bewertungen der einzelnen Anbieter:
// Metadaten, Normalisierung auf 0–100, Zusammenfassung und das Laden (mit Cache).

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY

export const PROVIDERS = [
  { key: 'imdb', label: 'IMDb',            short: 'IMDb', scale: 10,  group: 'audience' },
  { key: 'rt',   label: 'Rotten Tomatoes', short: 'RT',   scale: 100, group: 'critics', suffix: '%' },
  { key: 'mc',   label: 'Metacritic',      short: 'MC',   scale: 100, group: 'critics' },
  { key: 'lb',   label: 'Letterboxd',      short: 'LB',   scale: 5,   group: 'audience' },
  { key: 'tmdb', label: 'TMDB',            short: 'TMDB', scale: 10,  group: 'audience' },
]

export const normalize = (key, value) => {
  const p = PROVIDERS.find(x => x.key === key)
  if (!p || value == null || Number.isNaN(value)) return null
  return Math.max(0, Math.min(100, (value / p.scale) * 100))
}

export const tone = (pct) => (pct == null ? 'none' : pct >= 75 ? 'high' : pct >= 55 ? 'mid' : 'low')

export const formatValue = (key, value) => {
  if (value == null) return '—'
  if (key === 'rt') return `${Math.round(value)}%`
  if (key === 'mc') return String(Math.round(value))
  if (key === 'lb') return value.toFixed(2).replace(/0$/, '')
  return value.toFixed(1)
}

export const formatCount = (n) => {
  if (!n) return null
  const v = typeof n === 'string' ? parseInt(n.replace(/[^\d]/g, ''), 10) : n
  if (!v) return null
  if (v >= 1e6) return `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}M`
  if (v >= 1e3) return `${Math.round(v / 1e3)}K`
  return String(v)
}

const avg = (xs) => {
  const v = xs.filter(x => x != null)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}

// Gesamtwert + Kritiker vs. Publikum + kurzes Fazit
export function summarize(scores) {
  const norm = Object.fromEntries(PROVIDERS.map(p => [p.key, normalize(p.key, scores[p.key]?.value)]))
  const available = PROVIDERS.filter(p => norm[p.key] != null)
  const overall = avg(available.map(p => norm[p.key]))
  const critics = avg(PROVIDERS.filter(p => p.group === 'critics').map(p => norm[p.key]))
  const audience = avg(PROVIDERS.filter(p => p.group === 'audience').map(p => norm[p.key]))
  const values = available.map(p => norm[p.key])
  const spread = values.length > 1 ? Math.max(...values) - Math.min(...values) : 0

  let verdict = null
  if (critics != null && audience != null && critics - audience >= 12) verdict = 'Critics like it more than audiences'
  else if (critics != null && audience != null && audience - critics >= 12) verdict = 'Audiences like it more than critics'
  else if (values.length >= 3 && spread <= 12) verdict = 'All sources agree'
  else if (values.length >= 3 && spread >= 30) verdict = 'Opinions are split'

  return { overall, critics, audience, count: available.length, verdict, norm }
}

// ---------- Cache ----------
const cache = {
  get(key) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return undefined
      const { e, v } = JSON.parse(raw)
      if (e && Date.now() > e) return undefined
      return v
    } catch { return undefined }
  },
  set(key, v, days) {
    try { localStorage.setItem(key, JSON.stringify({ e: Date.now() + days * 864e5, v })) } catch {}
  },
}

// IMDb-ID über TMDB (für exakte Bewertungen bei OMDb und Letterboxd)
export async function getImdbId(tmdbId, type = 'movie') {
  const key = `ext:v1:${type}:${tmdbId}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${type === 'tv' ? 'tv' : 'movie'}/${tmdbId}/external_ids?api_key=${TMDB_KEY}`)
    const d = await res.json()
    const id = d.imdb_id || null
    cache.set(key, id, 30)
    return id
  } catch { return null }
}

// Letterboxd über die eigene Vercel-Funktion (/api/letterboxd)
export async function getLetterboxd({ tmdbId, imdbId, type }) {
  const params = new URLSearchParams()
  if (type !== 'tv' && tmdbId) params.set('tmdb', tmdbId)   // Letterboxd kennt TMDB-IDs nur für Filme
  if (imdbId) params.set('imdb', imdbId)
  if (![...params.keys()].length) return { error: 'not-found' }

  const key = `lb:v1:${params}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  try {
    const res = await fetch(`/api/letterboxd?${params}`)
    const d = await res.json().catch(() => ({}))
    if (res.ok && d.rating != null) {
      const v = { rating: d.rating, count: d.count || null, url: d.url || null }
      cache.set(key, v, 3)
      return v
    }
    const v = { error: res.status === 404 ? 'not-found' : 'unavailable' }
    if (res.status === 404) cache.set(key, v, 1)
    return v
  } catch { return { error: 'unavailable' } }
}

// Direkte Links zu jedem Anbieter
export function providerLinks({ tmdbId, type, imdbId, title, lbUrl }) {
  const q = encodeURIComponent(title || '')
  return {
    imdb: imdbId ? `https://www.imdb.com/title/${imdbId}/` : `https://www.imdb.com/find/?q=${q}`,
    rt:   `https://www.rottentomatoes.com/search?search=${q}`,
    mc:   `https://www.metacritic.com/search/${q}/`,
    lb:   lbUrl || (type !== 'tv' && tmdbId ? `https://letterboxd.com/tmdb/${tmdbId}/` : `https://letterboxd.com/search/${q}/`),
    tmdb: `https://www.themoviedb.org/${type === 'tv' ? 'tv' : 'movie'}/${tmdbId}`,
  }
}
