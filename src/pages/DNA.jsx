import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './DNA.css'

export default function DNA() {
  const [films, setFilms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('films').select('*')
    setFilms(data || [])
    setLoading(false)
  }

  if (loading) return <div className="dna-page"><div className="dna-loading">Analyzing your DNA...</div></div>

  const genreCount = {}
  films.forEach(f => (f.genres || []).forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1 }))
  const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 12)
  const maxGenre = topGenres[0]?.[1] || 1

  const rated = films.filter(f => f.user_rating)
  const avgRating = rated.length ? (rated.reduce((s, f) => s + f.user_rating, 0) / rated.length).toFixed(1) : 0

  const decades = {}
  films.forEach(f => {
    if (f.release_year) {
      const decade = Math.floor(f.release_year / 10) * 10
      decades[decade] = (decades[decade] || 0) + 1
    }
  })
  const topDecade = Object.entries(decades).sort((a, b) => b[1] - a[1])[0]

  const mediaTypes = { movie: 0, tv: 0 }
  films.forEach(f => { if (f.media_type === 'tv') mediaTypes.tv++; else mediaTypes.movie++ })

  const topGenre = topGenres[0]?.[0] || '—'
  const total = films.length

  const dnaProfile = [
    { label: 'Top Genre', value: topGenre, icon: '🎬' },
    { label: 'Fav Decade', value: topDecade ? `${topDecade[0]}s` : '—', icon: '📅' },
    { label: 'Avg Rating', value: avgRating ? `${avgRating}/10` : '—', icon: '⭐' },
    { label: 'Films vs Series', value: `${mediaTypes.movie}F / ${mediaTypes.tv}S`, icon: '📺' },
  ]

  const dnaFingerprint = topGenres.map(([genre, count]) => ({
    genre,
    pct: Math.round((count / maxGenre) * 100)
  }))

  const personality = avgRating >= 8 ? 'The Perfectionist' :
    avgRating >= 6.5 ? 'The Enthusiast' :
    avgRating >= 5 ? 'The Critic' : 'The Casual'

  const personalityDesc = {
    'The Perfectionist': 'You have extremely high standards. Only the best films make it to your top rated list.',
    'The Enthusiast': 'You genuinely enjoy most films you watch. Positive vibes all around.',
    'The Critic': 'You are hard to impress. Your ratings are a serious endorsement.',
    'The Casual': 'You watch for fun, not analysis. Entertainment is the goal.',
  }

  return (
    <div className="dna-page">
      <div className="dna-header">
        <div className="page-title">DNA Profile</div>
        <div className="page-sub">Your cinematic fingerprint — {total} films analyzed</div>
      </div>

      {total === 0 ? (
        <div className="dna-empty">
          <div style={{ fontSize: 48, marginBottom: 16, opacity: .4 }}>🧬</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text3)' }}>No DNA yet</div>
          <div style={{ fontSize: 14, color: 'var(--text4)', marginTop: 8, fontFamily: 'var(--mono)' }}>Add at least 10 films to generate your profile</div>
        </div>
      ) : (
        <>
          <div className="dna-personality-card">
            <div className="personality-label mono">YOUR FILM PERSONALITY</div>
            <div className="personality-title">{personality}</div>
            <div className="personality-desc">{personalityDesc[personality]}</div>
          </div>

          <div className="dna-grid">
            <div className="dna-card">
              <div className="dna-card-title">GENOME — TOP GENRES</div>
              <div className="dna-fingerprint">
                {dnaFingerprint.map(({ genre, pct }, i) => (
                  <div key={genre} className="dna-gene">
                    <div className="dna-gene-bar" style={{ height: `${pct}%`, opacity: 0.4 + pct * 0.006 }} />
                    <div className="dna-gene-label">{genre.substring(0, 4)}</div>
                  </div>
                ))}
              </div>
              <div className="dna-genre-list">
                {topGenres.slice(0, 6).map(([genre, count], i) => (
                  <div key={genre} className="dna-genre-row">
                    <div className="dna-genre-rank mono">#{i + 1}</div>
                    <div className="dna-genre-name">{genre}</div>
                    <div className="dna-genre-count mono">{count} films</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dna-right">
              <div className="dna-stats-row">
                {dnaProfile.map(({ label, value, icon }) => (
                  <div key={label} className="dna-stat-card">
                    <div className="dna-stat-icon">{icon}</div>
                    <div className="dna-stat-value">{value}</div>
                    <div className="dna-stat-label mono">{label}</div>
                  </div>
                ))}
              </div>

              <div className="dna-card">
                <div className="dna-card-title">MEDIA TYPE SPLIT</div>
                <div className="split-visual">
                  <div className="split-bar">
                    <div className="split-fill movie" style={{ width: `${total ? (mediaTypes.movie / total) * 100 : 50}%` }} />
                    <div className="split-fill tv" style={{ width: `${total ? (mediaTypes.tv / total) * 100 : 50}%` }} />
                  </div>
                  <div className="split-labels">
                    <div className="split-label"><div className="split-dot movie" /> Films: {mediaTypes.movie}</div>
                    <div className="split-label"><div className="split-dot tv" /> Series: {mediaTypes.tv}</div>
                  </div>
                </div>
              </div>

              <div className="dna-card">
                <div className="dna-card-title">DECADE PREFERENCE</div>
                <div className="decade-list">
                  {Object.entries(decades).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([decade, count]) => (
                    <div key={decade} className="decade-row">
                      <div className="decade-label">{decade}s</div>
                      <div className="decade-bar-track">
                        <div className="decade-bar-fill" style={{ width: `${(count / (Object.values(decades)[0] || 1)) * 100}%` }} />
                      </div>
                      <div className="decade-count mono">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
