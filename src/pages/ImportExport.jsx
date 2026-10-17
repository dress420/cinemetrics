import { useState } from 'react'
import { FileJson, FileSpreadsheet, Upload, FolderOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './ImportExport.css'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY

export default function ImportExport() {
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' })
  const [importDone, setImportDone] = useState(false)
  const [importStats, setImportStats] = useState({ added: 0, skipped: 0, failed: 0 })

  const exportJSON = async () => {
    const { data } = await supabase.from('films').select('*')
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    downloadBlob(blob, 'cinemetrics-library.json')
  }

  const exportCSV = async () => {
    const { data } = await supabase.from('films').select('*')
    if (!data || data.length === 0) return
    const headers = ['title', 'release_year', 'media_type', 'status', 'user_rating', 'genres', 'runtime', 'vote_average', 'format_tag', 'first_reaction', 'watched_date']
    const rows = data.map(f =>
      headers.map(h => {
        const val = f[h]
        if (Array.isArray(val)) return `"${val.join(', ')}"`
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`
        return val ?? ''
      }).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    downloadBlob(blob, 'cinemetrics-library.csv')
  }

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename
    document.body.appendChild(a); a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleLetterboxdImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportDone(false)

    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) { setImporting(false); return }

    const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    const dateIdx = header.findIndex(h => h === 'Date')
    const nameIdx = header.findIndex(h => h === 'Name')
    const yearIdx = header.findIndex(h => h === 'Year')
    const ratingIdx = header.findIndex(h => h === 'Rating')

    const entries = lines.slice(1).map(line => {
      const parts = parseCSVLine(line)
      return {
        name: parts[nameIdx] || '',
        year: parts[yearIdx] || '',
        rating: parts[ratingIdx] || '',
        date: parts[dateIdx] || '',
      }
    }).filter(e => e.name)

    let added = 0, skipped = 0, failed = 0

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      setProgress({ current: i + 1, total: entries.length, status: entry.name })

      try {
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(entry.name)}&year=${entry.year}`)
        const data = await res.json()
        const match = (data.results || [])[0]

        if (!match) { skipped++; continue }

        const { error } = await supabase.from('films').upsert({
          tmdb_id: match.id,
          title: match.title,
          poster_path: match.poster_path,
          backdrop_path: match.backdrop_path,
          overview: match.overview,
          release_year: match.release_date ? parseInt(match.release_date.split('-')[0]) : null,
          genres: (match.genre_ids || []).map(String),
          vote_average: match.vote_average,
          media_type: 'movie',
          status: 'seen',
          user_rating: entry.rating ? parseFloat(entry.rating) * 2 : null, // Letterboxd uses 0-5 scale
          watched_date: entry.date || null,
        }, { onConflict: 'tmdb_id' })

        if (error) failed++
        else added++
      } catch { failed++ }

      // Rate limit
      if ((i + 1) % 3 === 0) await new Promise(r => setTimeout(r, 300))
    }

    setImportStats({ added, skipped, failed })
    setImportDone(true)
    setImporting(false)
  }

  const handleJSONImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportDone(false)

    try {
      const text = await file.text()
      const films = JSON.parse(text)
      if (!Array.isArray(films)) throw new Error('Not an array')

      let added = 0, failed = 0

      for (let i = 0; i < films.length; i++) {
        setProgress({ current: i + 1, total: films.length, status: films[i].title || '' })
        const { error } = await supabase.from('films').upsert(films[i], { onConflict: 'tmdb_id' })
        if (error) failed++
        else added++
      }

      setImportStats({ added, skipped: 0, failed })
      setImportDone(true)
    } catch { setImportStats({ added: 0, skipped: 0, failed: 1 }) }
    setImporting(false)
  }

  return (
    <div className="ie-page">
      <div className="ie-header">
        <div className="page-title">Import / Export</div>
        <div className="page-sub">Back up your library or import from Letterboxd.</div>
      </div>

      <div className="ie-grid">
        <div className="ie-card">
          <div className="ie-card-title mono">EXPORT</div>
          <div className="ie-card-desc">Download your entire library.</div>
          <div className="ie-export-btns">
            <button className="btn-primary" onClick={exportJSON}><FileJson size={16} /> Export JSON</button>
            <button className="btn-secondary" onClick={exportCSV}><FileSpreadsheet size={16} /> Export CSV</button>
          </div>
        </div>

        <div className="ie-card">
          <div className="ie-card-title mono">IMPORT FROM LETTERBOXD</div>
          <div className="ie-card-desc">Upload your Letterboxd watched.csv export.</div>
          <label className="ie-upload-btn btn-primary">
            <Upload size={16} /> Choose CSV file
            <input type="file" accept=".csv" onChange={handleLetterboxdImport} hidden />
          </label>
          <div className="ie-hint mono">Go to Letterboxd → Settings → Import & Export → Export Your Data</div>
        </div>

        <div className="ie-card">
          <div className="ie-card-title mono">IMPORT JSON BACKUP</div>
          <div className="ie-card-desc">Restore from a CineMetrics JSON export.</div>
          <label className="ie-upload-btn btn-secondary">
            <FolderOpen size={16} /> Choose JSON file
            <input type="file" accept=".json" onChange={handleJSONImport} hidden />
          </label>
        </div>
      </div>

      {importing && (
        <div className="ie-progress">
          <div className="ie-progress-label mono">
            Importing {progress.current}/{progress.total}: {progress.status}
          </div>
          <div className="ie-progress-bar">
            <div className="ie-progress-fill" style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {importDone && (
        <div className="ie-done">
          <div className="ie-done-title">Import Complete</div>
          <div className="ie-done-stats mono">
            {importStats.added} added · {importStats.skipped} skipped · {importStats.failed} failed
          </div>
        </div>
      )}
    </div>
  )
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; continue }
    if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue }
    current += char
  }
  result.push(current.trim())
  return result
}
