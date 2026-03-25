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
  const [topPick, setTopPick] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

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
      const films = (data.results || []).filter(r => r.poster_path).slice(0, 20)
      setResults(films)

      if (films.length > 0) {
        const best = films[0]
        const overlapNames = overlap.map(id => GENRES.find(g => g.id === id)?.name).filter(Boolean)
        const p1Names = p1.map(id => GENRES.find(g => g.id === id)?.name).filter(Boolean)
        const p2Names = p2.map(id => GENRES.find(g => g.id === id)?.name).filter(Boolean)
        const reason = overlapNames.length > 0
          ? `You both love ${overlapNames.join(' & ')} — this is the highest-rated pick.`
          : `Combining ${p1Names[0]} and ${p2Names[0]} tastes — this bridges both worlds.`
        setTopPick({ title: best.title, year: best.release_date?.split('-')[0], score: best.vote_average?.toFixed(1), reason })
      }
    } catch { setResults([]) }
    setLoading(false)
  }

  const reset = () => { setP1([]); setP2([]); setResults([]); setTopPick(null); setStep(1) }
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
            Player {step === 1 ? 1 : 2} — pick up to 3 genres
            <span className="mono" style={{ marginLeft: 'auto', color: 'var(--text4)' }}>{currentList.length}/3</span>
          </div>
          <div className="tp2-genre-grid">
            {GENRES.map(g => (
              <button key={g.id} className={`tp2-genre${currentList.includes(g.id) ? ' active' : ''}`} onClick={() => toggle(step === 1 ? 1 : 2, g.id)}>
                {g.name}
              </button>
            ))}
          </div>
          <div className="tp2-actions">
            {step === 1 && <button className="btn-primary" onClick={() => setStep(2)} disabled={p1.length === 0}>Player 2's Turn →</button>}
            {step === 2 && <button className="btn-primary" onClick={findFilms} disabled={p2.length === 0}>Find Our Film →</button>}
          </div>
        </>
      )}

      {step === 3 && loading && <div className="tp2-loading mono">Finding the perfect compromise...</div>}

      {step === 3 && !loading && (
        <>
          {topPick && (
            <div className="tp2-ai-pick">
              <div className="tp2-ai-label mono">TOP PICK FOR BOTH</div>
              <div className="tp2-ai-title">{topPick.title} <span style={{ color: 'var(--text4)', fontSize: 18, fontWeight: 400 }}>({topPick.year}) ⭐ {topPick.score}</span></div>
              <div className="tp2-ai-reason">{topPick.reason}</div>
            </div>
          )}
          <div className="tp2-results">
            {results.map(f => (
              <div key={f.id} className="sf-film">
                <div className="sf-film-poster">
                  <img src={`${IMG_THUMB}${f.poster_path}`} alt={f.title} loading="lazy" />
                  <div className="sf-film-score mono">{f.vote_average?.toFixed(1)}</div>
                </div>
                <div className="sf-film-info">
                  <div className="sf-film-title">{f.title}</div>
                  <div className="sf-film-year mono">{f.release_date?.split('-')[0]}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
