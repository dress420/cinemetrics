import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { IMG_THUMB } from '../lib/tmdb'
import './ActorHeatmap.css'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY

export default function ActorHeatmap() {
  const [actors, setActors] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data: films } = await supabase.from('films').select('tmdb_id, title, media_type')
    if (!films || films.length === 0) { setLoading(false); return }

    const actorMap = {} // actorId -> { name, profile_path, count, films[] }
    const movieIds = films.filter(f => f.media_type !== 'tv').map(f => f.tmdb_id)

    // Batch with rate limit awareness — process 3 at a time
    for (let i = 0; i < movieIds.length; i += 3) {
      const batch = movieIds.slice(i, i + 3)
      setProgress(`Scanning ${Math.min(i + 3, movieIds.length)}/${movieIds.length} films...`)

      await Promise.all(batch.map(async (id) => {
        try {
          const res = await fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${API_KEY}`)
          const data = await res.json()
          const cast = (data.cast || []).slice(0, 5) // top 5 billed
          const filmTitle = films.find(f => f.tmdb_id === id)?.title || ''
          cast.forEach(c => {
            if (!actorMap[c.id]) {
              actorMap[c.id] = { id: c.id, name: c.name, profile_path: c.profile_path, count: 0, films: [] }
            }
            actorMap[c.id].count++
            actorMap[c.id].films.push(filmTitle)
          })
        } catch {}
      }))

      // Small delay to respect rate limits
      if (i + 3 < movieIds.length) await new Promise(r => setTimeout(r, 300))
    }

    const sorted = Object.values(actorMap)
      .filter(a => a.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 40)

    setActors(sorted)
    setLoading(false)
  }

  const maxCount = actors[0]?.count || 1

  return (
    <div className="hm-page">
      <div className="hm-header">
        <div className="page-title">Actor Heatmap</div>
        <div className="page-sub">Which actors appear most in your library?</div>
      </div>

      {loading ? (
        <div className="hm-loading">
          <div className="hm-loading-icon">🔍</div>
          <div className="hm-loading-text mono">{progress || 'Scanning your library...'}</div>
        </div>
      ) : actors.length === 0 ? (
        <div className="hm-empty">
          <div style={{ fontSize: 48, opacity: .3, marginBottom: 16 }}>▣</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text3)' }}>Not enough data</div>
          <div className="mono" style={{ fontSize: 13, color: 'var(--text4)', marginTop: 8 }}>
            Add more films to see your actor heatmap
          </div>
        </div>
      ) : (
        <div className="hm-grid">
          {actors.map(a => {
            const sizeFactor = 0.6 + (a.count / maxCount) * 0.4
            return (
              <div
                key={a.id}
                className="hm-actor"
                style={{ transform: `scale(${sizeFactor})` }}
                title={`${a.name}: ${a.films.join(', ')}`}
              >
                {a.profile_path
                  ? <img src={`${IMG_THUMB}${a.profile_path}`} alt={a.name} className="hm-actor-img" />
                  : <div className="hm-actor-placeholder">{a.name?.charAt(0)}</div>
                }
                <div className="hm-actor-name">{a.name}</div>
                <div className="hm-actor-count mono">{a.count} films</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
