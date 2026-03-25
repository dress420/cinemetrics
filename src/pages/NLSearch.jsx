import { useState } from 'react'
import { discoverMovies, IMG_THUMB } from '../lib/tmdb'
import './NLSearch.css'

const EXAMPLES = [
  'Thriller like Se7en but less brutal',
  'Feel-good comedy from the 2000s',
  'Sci-fi with a mind-bending twist',
  'Dark crime drama with great acting',
  'Visually stunning animated film',
  'Underrated horror from the 90s',
]

export default function NLSearch() {
  const [query, setQuery] = useState('')
  const [films, setFilms] = useState([])
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleSearch = async (q) => {
    const searchQuery = q || query
    if (!searchQuery.trim()) return
    setLoading(true)
    setError('')
    setFilms([])
    setReason('')

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are a film recommendation engine. The user wants: "${searchQuery}"

Convert this into TMDB discover API parameters. Return ONLY valid JSON with these fields:
{
  "with_genres": "comma-separated genre IDs (28=Action,12=Adventure,16=Animation,35=Comedy,80=Crime,99=Documentary,18=Drama,10751=Family,14=Fantasy,36=History,27=Horror,10402=Music,9648=Mystery,10749=Romance,878=Sci-Fi,53=Thriller,10752=War,37=Western)",
  "sort_by": "popularity.desc or vote_average.desc",
  "vote_average_gte": number between 5-9,
  "vote_count_gte": number 50-2000,
  "primary_release_date_gte": "YYYY-MM-DD or empty",
  "primary_release_date_lte": "YYYY-MM-DD or empty",
  "with_keywords": "keyword IDs if relevant or empty",
  "reason": "One sentence explaining the search logic"
}

Return ONLY the JSON object, nothing else.`
          }],
        }),
      })

      const data = await res.json()
      const text = data.content?.map(c => c.text || '').join('') || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const params = JSON.parse(clean)

      setReason(params.reason || '')

      const discoverParams = { sort_by: params.sort_by || 'popularity.desc' }
      if (params.with_genres) discoverParams.with_genres = params.with_genres
      if (params.vote_average_gte) discoverParams['vote_average.gte'] = params.vote_average_gte
      if (params.vote_count_gte) discoverParams['vote_count.gte'] = params.vote_count_gte
      if (params.primary_release_date_gte) discoverParams['primary_release_date.gte'] = params.primary_release_date_gte
      if (params.primary_release_date_lte) discoverParams['primary_release_date.lte'] = params.primary_release_date_lte
      if (params.with_keywords) discoverParams.with_keywords = params.with_keywords

      const result = await discoverMovies(discoverParams)
      setFilms((result.results || []).filter(r => r.poster_path).slice(0, 16))
    } catch (e) {
      setError('Search failed — try again or rephrase.')
    }
    setLoading(false)
  }

  return (
    <div className="nls-page">
      <div className="nls-header">
        <div className="page-title">Natural Language Search</div>
        <div className="page-sub">Describe what you want to watch — AI finds it.</div>
      </div>

      <div className="nls-search-area">
        <div className="nls-input-row">
          <input
            className="nls-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder='e.g. "dark thriller with an unreliable narrator"'
          />
          <button className="btn-primary nls-go" onClick={() => handleSearch()} disabled={loading}>
            {loading ? '...' : '→'}
          </button>
        </div>
        <div className="nls-examples">
          {EXAMPLES.map(ex => (
            <button key={ex} className="nls-example tag" onClick={() => { setQuery(ex); handleSearch(ex) }}>
              {ex}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="nls-error mono">{error}</div>}
      {reason && <div className="nls-reason mono">🧠 {reason}</div>}

      {loading && <div className="nls-loading mono">AI is thinking...</div>}

      {!loading && films.length > 0 && (
        <div className="nls-results">
          {films.map(f => (
            <div key={f.id} className="vibe-film">
              <div className="vibe-film-poster">
                <img src={`${IMG_THUMB}${f.poster_path}`} alt={f.title} loading="lazy" />
                <div className="vibe-film-score mono">{f.vote_average?.toFixed(1)}</div>
              </div>
              <div className="vibe-film-info">
                <div className="vibe-film-title">{f.title}</div>
                <div className="vibe-film-year mono">{f.release_date?.split('-')[0]}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
