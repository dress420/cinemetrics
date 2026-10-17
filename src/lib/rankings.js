// Ranglisten für die Startseite.
//
// Der Zeitraum bestimmt, WELCHE Titel in Frage kommen (ein Pool von TMDB):
//   Today / This Week  → was gerade trendet
//   This Month / Year  → die bekanntesten Neuerscheinungen in dem Zeitraum
//   All Time           → anerkannte, viel bewertete Filme aller Zeiten
// Die Quelle bestimmt, WIE sortiert wird — mit den echten Werten von IMDb, Rotten Tomatoes,
// Metacritic (über OMDb) und Letterboxd. TMDB und "In Cinemas" bleiben in TMDBs eigener Reihenfolge.

import { getOMDBData } from './omdb'
import { getImdbId, getLetterboxd } from './ratings'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE = 'https://api.themoviedb.org/3'

export const PAGE_SIZE = 20
export const MAX_PAGES = 50

export const RUNTIME_FILTERS = [
  { key: 'any',    label: 'Any length',   lte: null, gte: null },
  { key: 'short',  label: 'Under 90 min', lte: 90,   gte: null },
  { key: 'medium', label: '90–120 min',   lte: 120,  gte: 90 },
  { key: 'epic',   label: '2h+',          lte: null, gte: 120 },
]

// Quellen, die nach ihren echten Werten sortiert werden.
// blockPages: so viele TMDB-Seiten (à 20) werden gemeinsam sortiert → Seite 1 zeigt die besten aus 60.
const RANKED = {
  imdb:         { provider: 'imdb', name: 'IMDb',            rankLabel: 'Highest IMDb rating',       blockPages: 3, concurrency: 12 },
  rottentomato: { provider: 'rt',   name: 'Rotten Tomatoes', rankLabel: 'Highest Tomatometer',       blockPages: 3, concurrency: 12 },
  metacritic:   { provider: 'mc',   name: 'Metacritic',      rankLabel: 'Highest Metascore',         blockPages: 3, concurrency: 12 },
  letterboxd:   { provider: 'lb',   name: 'Letterboxd',      rankLabel: 'Highest Letterboxd rating', blockPages: 1, concurrency: 8 },
}

// Mindest-Stimmen auf TMDB für den Pool. Jede Stufe wird nur probiert, wenn die vorherige zu wenig liefert.
const VOTE_STEPS = {
  month:   () => [10, 0],
  year:    () => [50, 10],
  alltime: (source) => source === 'tmdb' ? [1000, 100] : source === 'imdb' ? [3000, 1000, 300] : [1500, 500, 150],
}

// ---------- Helfer ----------
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d) }

const url = (path, params) =>
  `${BASE}${path}?${new URLSearchParams({ api_key: API_KEY, language: 'en-US', ...params })}`

const getJSON = async (u) => {
  const res = await fetch(u)
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  return res.json()
}

const clean = (results, fallbackType) =>
  (results || [])
    .filter(r => r.poster_path && r.media_type !== 'person')
    .map(r => ({ ...r, media_type: r.media_type || fallbackType }))

const dedupe = (items) => {
  const seen = new Set()
  return items.filter(i => {
    const k = `${i.media_type}-${i.id}`
    if (seen.has(k)) return false
    seen.add(k); return true
  })
}

const toNum = (v) => (v == null ? null : typeof v === 'number' ? v : parseInt(String(v).replace(/[^\d]/g, ''), 10) || null)

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

// ---------- Pool (welche Titel) ----------
function windows(time) {
  const today = iso(new Date())
  const y = new Date().getFullYear()
  if (time === 'month') return [
    { gte: daysAgo(30), lte: today, label: 'released in the last 30 days' },
    { gte: daysAgo(90), lte: today, label: 'released in the last 90 days' },
  ]
  if (time === 'year') return [
    { gte: `${y}-01-01`, lte: today, label: `released in ${y}` },
    { gte: daysAgo(365), lte: today, label: 'released in the last 12 months' },
  ]
  return [{ label: 'all-time acclaimed films' }]
}

function discoverParams({ source, time, runtime, win, minVotes }) {
  const rt = RUNTIME_FILTERS.find(r => r.key === runtime) || RUNTIME_FILTERS[0]
  const p = {
    include_adult: 'false',
    'vote_count.gte': minVotes,
    // Allzeit: TMDB = meistbewertet, alle anderen = anerkannteste Filme (werden danach neu sortiert)
    sort_by: time === 'alltime' ? (source === 'tmdb' ? 'vote_count.desc' : 'vote_average.desc') : 'popularity.desc',
  }
  if (win.gte) { p['primary_release_date.gte'] = win.gte; p['primary_release_date.lte'] = win.lte }
  if (rt.lte) p['with_runtime.lte'] = rt.lte
  if (rt.gte) p['with_runtime.gte'] = rt.gte
  return p
}

// Findet einmal pro Sitzung die passenden Filter (Zeitfenster + Mindeststimmen), damit alle Seiten dieselben nutzen
const resolved = new Map()
function resolveDiscover(source, time, runtime) {
  const key = `${source}|${time}|${runtime}|${iso(new Date())}`
  if (resolved.has(key)) return resolved.get(key)
  const p = (async () => {
    let last = null
    for (const win of windows(time)) {
      for (const minVotes of VOTE_STEPS[time](source)) {
        const params = discoverParams({ source, time, runtime, win, minVotes })
        const d = await getJSON(url('/discover/movie', { ...params, page: 1 }))
        last = { params, label: win.label }
        if ((d.total_results || 0) >= PAGE_SIZE) return last
      }
    }
    return last
  })()
  resolved.set(key, p)
  p.catch(() => resolved.delete(key))
  return p
}

async function getPool({ source, time, runtime, block, blockPages }) {
  const first = (block - 1) * blockPages + 1
  const pages = Array.from({ length: blockPages }, (_, i) => first + i)

  if (time === 'day' || time === 'week') {
    const kind = source === 'tmdb' ? 'all' : 'movie'
    const res = await Promise.all(pages.map(p => getJSON(url(`/trending/${kind}/${time}`, { page: p }))))
    const items = dedupe(res.flatMap(d => clean(d.results, kind === 'all' ? undefined : 'movie')))
    if (items.length || block > 1) {
      return { items, totalPages: res[0].total_pages || 1, label: time === 'day' ? 'trending today' : 'trending this week' }
    }
    // Trendliste leer → auf "This Month" ausweichen
    return getPool({ source, time: 'month', runtime, block, blockPages })
  }

  const q = await resolveDiscover(source, time, runtime)
  const res = await Promise.all(pages.map(p => getJSON(url('/discover/movie', { ...q.params, page: p }))))
  return {
    items: dedupe(res.flatMap(d => clean(d.results, 'movie'))),
    totalPages: res[0].total_pages || 1,
    label: q.label,
  }
}

// ---------- Werte (wie sortiert wird) ----------
async function scoreFor(item, provider) {
  if (provider === 'lb') {
    const r = await getLetterboxd({ tmdbId: item.id, type: item.media_type })
    return r.rating != null ? { value: r.rating, count: r.count || null } : { error: r.error || 'not-found' }
  }
  const tt = await getImdbId(item.id, item.media_type)
  if (!tt) return { error: 'not-found' }   // ohne IMDb-ID lieber nichts als ein falscher Treffer
  const o = await getOMDBData({ imdbId: tt })
  if (o.error) return { error: o.error }
  const value = provider === 'imdb' ? o.imdbRating : provider === 'rt' ? o.rtRating : o.metacritic
  return { value: value ?? null, count: provider === 'imdb' ? toNum(o.imdbVotes) : null, imdb: o.imdbRating, imdbVotes: toNum(o.imdbVotes) }
}

const HARD_ERRORS = ['invalid-key', 'limit', 'network', 'unavailable']

function sortKey(item, provider, time) {
  const s = item.score
  if (s?.value == null) return -Infinity
  // Bei neuen Filmen zählt IMDb wie die Top 250 gewichtet — 40 Stimmen mit 9.4 landen nicht auf Platz 1
  if (provider === 'imdb' && time !== 'alltime') {
    const v = s.count || 0, m = 1000, C = 6.5
    return (v / (v + m)) * s.value + (m / (v + m)) * C
  }
  return s.value
}
const tieKey = (item, provider) =>
  provider === 'imdb' ? (item.score?.imdbVotes || 0)
  : provider === 'lb' ? (item.score?.count || 0)
  : (item.score?.imdb || 0) * 1e7 + (item.vote_count || 0)

async function rankItems(items, source, time) {
  const cfg = RANKED[source]
  let stop = null
  let hard = 0
  const scored = await mapLimit(items, cfg.concurrency, async (item) => {
    if (stop) return { ...item, score: { error: stop } }
    const score = await scoreFor(item, cfg.provider).catch(() => ({ error: 'network' }))
    if (HARD_ERRORS.includes(score.error)) {
      hard++
      // ungültiger Key / Tageslimit: sofort aufhören, sonst nach 3 Ausfällen
      if (score.error === 'invalid-key' || score.error === 'limit' || hard >= 3) stop = score.error
    }
    return { ...item, score }
  })

  const withValue = scored.filter(i => i.score?.value != null).length
  const failed = scored.filter(i => HARD_ERRORS.includes(i.score?.error))
  if (failed.length && withValue < scored.length / 2) {
    // Anbieter gerade nicht erreichbar → TMDB-Reihenfolge behalten und das offen sagen
    return { items, degraded: failed.find(i => i.score.error === 'invalid-key')?.score.error || failed.find(i => i.score.error === 'limit')?.score.error || failed[0].score.error }
  }

  const ranked = scored
    .map((item, i) => ({ item, i, k: sortKey(item, cfg.provider, time), t: tieKey(item, cfg.provider) }))
    .sort((a, b) => (b.k - a.k) || (b.t - a.t) || (a.i - b.i))
    .map(x => x.item)
  return { items: ranked, degraded: null }
}

// ---------- Blöcke mit Cache ----------
const blocks = new Map()
const BLOCK_TTL = 10 * 60e3

function getBlock({ source, time, runtime, block }) {
  const cfg = RANKED[source]
  const blockPages = cfg?.blockPages || 1
  const key = `${source}|${time}|${runtime}|${block}`
  const hit = blocks.get(key)
  if (hit && Date.now() - hit.t < hit.ttl) return hit.p

  const p = (async () => {
    const pool = await getPool({ source, time, runtime, block, blockPages })
    if (!cfg) return { ...pool, degraded: null }
    const r = await rankItems(pool.items, source, time)
    return { ...pool, items: r.items, degraded: r.degraded }
  })()
  blocks.set(key, { t: Date.now(), ttl: BLOCK_TTL, p })
  p.then(r => { if (r.degraded) blocks.set(key, { t: Date.now(), ttl: 60e3, p }) }, () => blocks.delete(key))
  return p
}

function listLabel(source, time, poolLabel, degraded) {
  const cfg = RANKED[source]
  if (cfg && degraded) {
    const why = degraded === 'invalid-key' ? 'the OMDb API key is invalid'
      : degraded === 'limit' ? 'the daily OMDb limit is reached'
      : `${cfg.name} is not reachable right now`
    return `Live ${cfg.name} scores unavailable — ${why}. Showing TMDB order.`
  }
  if (cfg) return `${cfg.rankLabel} · ${poolLabel}`
  if (time === 'day') return 'Trending on TMDB today'
  if (time === 'week') return 'Trending on TMDB this week'
  if (time === 'alltime') return 'Most-rated films on TMDB'
  return `Most popular on TMDB · ${poolLabel}`
}

/**
 * Eine Seite der Rangliste.
 * @returns {{ items, totalPages, label, provider, degraded }}
 *   provider: welcher Anbieter-Wert in jeder Zeile steht (null = TMDB-Sterne)
 */
export async function fetchList({ source, time, page, runtime }) {
  if (source === 'nowplaying') {
    const d = await getJSON(url('/movie/now_playing', { page, region: 'DE' }))
    return { items: clean(d.results, 'movie'), totalPages: Math.min(d.total_pages || 1, MAX_PAGES), label: 'Now showing in German cinemas', provider: null, degraded: null }
  }

  const cfg = RANKED[source]
  const blockPages = cfg?.blockPages || 1
  const block = Math.ceil(page / blockPages)
  const b = await getBlock({ source, time, runtime, block })
  const offset = ((page - 1) % blockPages) * PAGE_SIZE

  return {
    items: b.items.slice(offset, offset + PAGE_SIZE),
    totalPages: Math.max(1, Math.min(b.totalPages, MAX_PAGES)),
    label: listLabel(source, time, b.label, b.degraded),
    provider: cfg && !b.degraded ? cfg.provider : null,
    degraded: b.degraded,
  }
}

export const isRankedSource = (source) => Boolean(RANKED[source])
