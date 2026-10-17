import { useState } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'
import { discoverMovies } from '../lib/tmdb'
import MiniCard from '../components/MiniCard'
import './NLSearch.css'

const EXAMPLES = [
  'Thriller like Se7en but less brutal',
  'Feel-good comedy from the 2000s',
  'Sci-fi with a mind-bending twist',
  'Dark crime drama with great acting',
  'Visually stunning animated film',
  'Underrated horror from the 90s',
]

const GENRE_KEYWORDS = {
  action: 28, adventure: 12, animation: 16, animated: 16, comedy: 35, funny: 35,
  crime: 80, documentary: 99, drama: 18, family: 10751, fantasy: 14,
  history: 36, historical: 36, horror: 27, scary: 27, music: 10402,
  mystery: 9648, romance: 10749, romantic: 10749, love: 10749,
  'sci-fi': 878, scifi: 878, 'science fiction': 878, thriller: 53, suspense: 53,
  war: 10752, western: 37, dark: 80, gritty: 80, epic: 12,
  'feel-good': 35, 'feel good': 35, wholesome: 10751, heartwarming: 18,
  psychological: 53, mind: 878, twist: 9648, brutal: 28, violent: 28,
  creepy: 27, disturbing: 27, emotional: 18, sad: 18,
  smart: 9648, intelligent: 9648, clever: 9648,
}

const FILM_VIBES = {
  'se7en': [80, 53, 9648], 'seven': [80, 53, 9648], 'inception': [878, 28, 53],
  'interstellar': [878, 18, 12], 'the shining': [27, 53], 'pulp fiction': [80, 53],
  'fight club': [18, 53], 'matrix': [878, 28], 'godfather': [80, 18],
  'alien': [27, 878], 'blade runner': [878, 53, 18], 'parasite': [53, 18, 35],
  'get out': [27, 53, 9648], 'hereditary': [27, 18], 'whiplash': [18, 10402],
  'gone girl': [53, 18, 9648], 'zodiac': [80, 53, 9648], 'prisoners': [80, 53, 9648],
  'shutter island': [53, 9648, 27], 'memento': [53, 9648],
  'silence of the lambs': [80, 53, 27], 'taxi driver': [80, 18],
  'nightcrawler': [80, 53, 18], 'sicario': [28, 80, 53], 'drive': [80, 53, 18],
  'john wick': [28, 53], 'mad max': [28, 878, 12],
}

function parseQuery(query) {
  const q = query.toLowerCase()
  const params = { sort_by: 'vote_average.desc', 'vote_count.gte': 200, 'vote_average.gte': 6 }

  const likeMatch = q.match(/like\s+(.+?)(\s+but|\s*$)/i)
  if (likeMatch) {
    const ref = likeMatch[1].toLowerCase().trim()
    for (const [film, genres] of Object.entries(FILM_VIBES)) {
      if (ref.includes(film)) { params.with_genres = genres.join(','); break }
    }
  }

  if (!params.with_genres) {
    const found = new Set()
    for (const [kw, id] of Object.entries(GENRE_KEYWORDS)) { if (q.includes(kw)) found.add(id) }
    if (found.size > 0) params.with_genres = [...found].slice(0, 3).join(',')
  }

  const fromDecade = q.match(/(?:from the |in the )?(\d{4})s/)
  if (fromDecade) { const d = parseInt(fromDecade[1]); params['primary_release_date.gte'] = `${d}-01-01`; params['primary_release_date.lte'] = `${d + 9}-12-31` }
  const shortDecade = q.match(/\b(\d{2})s\b/)
  if (shortDecade && !fromDecade) { const d = parseInt(shortDecade[1]); const full = d < 30 ? 2000 + d : 1900 + d; params['primary_release_date.gte'] = `${full}-01-01`; params['primary_release_date.lte'] = `${full + 9}-12-31` }
  if (q.includes('underrated') || q.includes('hidden gem')) { params['vote_count.gte'] = 30; params['vote_count.lte'] = 500 }
  if (q.includes('less brutal') || q.includes('not too') || q.includes('lighter')) { params['vote_average.gte'] = 7 }

  const genreMap = { 28:'Action', 12:'Adventure', 16:'Animation', 35:'Comedy', 80:'Crime', 18:'Drama', 14:'Fantasy', 27:'Horror', 9648:'Mystery', 10749:'Romance', 878:'Sci-Fi', 53:'Thriller', 10752:'War', 10751:'Family' }
  const ids = (params.with_genres || '').split(',').filter(Boolean).map(Number)
  const names = ids.map(id => genreMap[id]).filter(Boolean)
  const reason = names.length > 0 ? `Searching ${names.join(' + ')} films` : 'Broad search based on your description'
  return { params, reason }
}

export default function NLSearch() {
  const [query, setQuery] = useState('')
  const [films, setFilms] = useState([])
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleSearch = async (q) => {
    const s = q || query; if (!s.trim()) return
    setLoading(true); setError(''); setFilms([]); setReason('')
    try {
      const { params, reason: r } = parseQuery(s); setReason(r)
      const result = await discoverMovies(params)
      let results = (result.results || []).filter(r => r.poster_path).slice(0, 24)
      if (results.length === 0) { delete params['vote_count.lte']; params['vote_count.gte'] = 50; params['vote_average.gte'] = 5.5; const fb = await discoverMovies(params); results = (fb.results || []).filter(r => r.poster_path).slice(0, 24) }
      setFilms(results)
    } catch { setError('Search failed — try different keywords.') }
    setLoading(false)
  }

  return (
    <div className="nls-page">
      <div className="nls-header">
        <div className="page-title">Natural Language Search</div>
        <div className="page-sub">Describe what you want to watch — we'll find it.</div>
      </div>
      <div className="nls-search-area">
        <div className="nls-input-row">
          <input className="nls-input" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder='e.g. "dark thriller with an unreliable narrator"' />
          <button className="btn-primary nls-go" onClick={() => handleSearch()} disabled={loading}>{loading ? '…' : <ArrowRight size={18} />}</button>
        </div>
        <div className="nls-examples">
          {EXAMPLES.map(ex => <button key={ex} className="nls-example tag" onClick={() => { setQuery(ex); handleSearch(ex) }}>{ex}</button>)}
        </div>
      </div>
      {error && <div className="nls-error mono">{error}</div>}
      {reason && <div className="nls-reason mono"><Sparkles size={14} /> {reason}</div>}
      {loading && <div className="nls-loading mono">Searching...</div>}
      {!loading && films.length > 0 && <div className="mc-grid">{films.map(f => <MiniCard key={f.id} film={f} />)}</div>}
      {!loading && !error && films.length === 0 && query && reason && <div className="empty-state"><div className="empty-state-title">No films found</div><div className="empty-state-sub">Try different keywords</div></div>}
    </div>
  )
}
