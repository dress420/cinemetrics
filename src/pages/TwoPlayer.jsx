import { useState } from 'react'
import { discoverMovies, IMG_THUMB } from '../lib/tmdb'
import './TwoPlayer.css'

const GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' }, { id: 14, name: 'Fantasy' }, { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' }, { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' }, { id: 10752, name: 'War' },
]

export default function TwoPlayer() {
  const [p1, setP1] = useState([])
  const [p2, setP2] = useState([])
  const [results, setResults] = useState([])
  const [aiPick, setAiPick] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1=P1, 2=P2, 3=results

  const toggle = (player, id) => {
    const [list, setList] = player === 1 ? [p1, setP1] : [p2, setP2]
    if (list.includes(id)) setList(list.filter(x => x !== id))
    else if (list.length < 3) setList([...list, id])
  }

  const findFilms = async () => {
    setLoading(true)
    setStep(3)
    const overlap = p1.filter(id => p2.includes(id))
    const allGenres = [...new Set([...p1, ...p2])]
    const searchGenres = overlap.length > 0 ? overlap : allGenres

    try {
      const data = await discoverMovies({
        with_genres: searchGenres.join(','),
        sort_by: 'vote_average.desc',
        'vote_count.gte': 300,
        'vote_average.gte': 6.5,
      })
      const films = (data.results || []).filter(r => r.poster_path).slice(0, 12)
      setResults(films)

      // Ask Claude for the best compromise
      if (films.length > 0) {
        const p1Names = p1.map(id => GENRES.find(g => g.id === id)?.name).filter(Boolean)
        const p2Names = p2.map(id => GENRES.find(g => g.id === id)?.name).filter(Boolean)
        const filmList = films.slice(0, 6).map(f => `${f.title} (${f.release_date?.split('-')[0]}, ⭐${f.vote_average?.toFixed(1)})`).join(', ')

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            messages: [{
              role: 'user',
              content: `Player 1 likes: ${p1Names.join(', ')}. Player 2 likes: ${p2Names.join(', ')}.
From these films: ${filmList}
Pick the BEST compromise film both will enjoy.
Return ONLY JSON: { "title": "...", "reason": "one-sentence why this works for both" }`
            }],
          }),
        })
        const aiData = await res.json()
        const text = aiData.content?.map(c => c.text || '').join('') || ''
        const clean = text.replace(/```json|```/g, '').trim()
        setAiPick(JSON.parse(clean))
      }
    } catch { setResults([]) }
    setLoading(false)
  }

  const reset = () => { setP1([]); setP2([]); setResults([]); setAiPick(null); setStep(1) }

  const currentPlayer = step === 1 ? 1 : 2
  const currentList = step === 1 ? p1 : p2

  return (
    <div className="tp2-page">
      <div className="tp2-header-bar">
        <div>
          <div className="page-title">Two-Player Mode</div>
          <div className="page-sub">Find a film you'll both love.</div>
        </div>
        {step === 3 && <button className="btn-secondary" onClick={reset}>↻ Start Over</button>}
      </div>

      {step <= 2 && (
        <>
          <div className="tp2-player-label">
            <span className={`tp2-dot ${step === 1 ? 'p1' : 'p2'}`} />
            Player {currentPlayer} — pick up to 3 genres
            <span className="mono" style={{ marginLeft: 'auto', color: 'var(--text4)' }}>
              {currentList.length}/3
            </span>
          </div>
          <div className="tp2-genre-grid">
            {GENRES.map(g => (
              <button
                key={g.id}
                className={`tp2-genre${currentList.includes(g.id) ? ' active' : ''}`}
                onClick={() => toggle(currentPlayer, g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>
          <div className="tp2-actions">
            {step === 1 && (
              <button className="btn-primary" onClick={() => setStep(2)} disabled={p1.length === 0}>
                Player 2's Turn →
              </button>
            )}
            {step === 2 && (
              <button className="btn-primary" onClick={findFilms} disabled={p2.length === 0}>
                Find Our Film →
              </button>
            )}
          </div>
        </>
      )}

      {step === 3 && loading && (
        <div className="tp2-loading mono">Finding the perfect compromise...</div>
      )}

      {step === 3 && !loading && (
        <>
          {aiPick && (
            <div className="tp2-ai-pick">
              <div className="tp2-ai-label mono">AI'S TOP PICK FOR BOTH</div>
              <div className="tp2-ai-title">{aiPick.title}</div>
              <div className="tp2-ai-reason">{aiPick.reason}</div>
            </div>
          )}
          <div className="tp2-results">
            {results.map(f => (
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
        </>
      )}
    </div>
  )
}
