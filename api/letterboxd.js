// Vercel Serverless Function — holt das öffentliche Letterboxd-Rating eines Films.
// Letterboxd hat keine frei zugängliche API, und der Browser darf letterboxd.com wegen CORS
// nicht direkt abfragen. Darum liest diese Funktion die öffentliche Filmseite serverseitig
// (strukturierte JSON-LD-Daten) und gibt nur Rating, Anzahl und Link zurück.
//
// Aufruf:  /api/letterboxd?tmdb=<TMDB-Film-ID>&imdb=<tt…>
// Antwort: { rating: 4.12, count: 812345, url: "https://letterboxd.com/film/…/", name: "…" }

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

export function parseLetterboxd(html) {
  let rating = null
  let count = null
  let name = null

  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
  if (ld) {
    const raw = ld[1]
      .replace(/\/\*\s*<!\[CDATA\[\s*\*\//, '')
      .replace(/\/\*\s*\]\]>\s*\*\//, '')
      .trim()
    try {
      const data = JSON.parse(raw)
      name = data.name || null
      if (data.aggregateRating) {
        rating = Number(data.aggregateRating.ratingValue)
        count = Number(data.aggregateRating.ratingCount) || null
      }
    } catch { /* fällt auf Meta-Tag zurück */ }
  }

  if (rating == null || Number.isNaN(rating)) {
    const meta = html.match(/<meta name="twitter:data2" content="([\d.]+) out of 5"/)
    rating = meta ? parseFloat(meta[1]) : null
  }

  return {
    rating: rating != null && !Number.isNaN(rating) ? Math.round(rating * 100) / 100 : null,
    count,
    name,
  }
}

function send(res, status, body, cacheSeconds) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (cacheSeconds) {
    // Vercel-Edge cached das Ergebnis → gleiche Filme kosten keinen neuen Abruf
    res.setHeader('Cache-Control', `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 7}`)
  }
  res.end(JSON.stringify(body))
}

export default async function handler(req, res) {
  const params = new URL(req.url, 'http://localhost').searchParams
  const tmdb = params.get('tmdb')
  const imdb = params.get('imdb')

  const targets = []
  if (tmdb && /^\d{1,9}$/.test(tmdb)) targets.push(`https://letterboxd.com/tmdb/${tmdb}/`)
  if (imdb && /^tt\d{5,10}$/.test(imdb)) targets.push(`https://letterboxd.com/imdb/${imdb}/`)
  if (!targets.length) return send(res, 400, { error: 'tmdb or imdb id required' })

  let blocked = false
  for (const target of targets) {
    try {
      const r = await fetch(target, {
        redirect: 'follow',
        headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9' },
      })
      if (r.status === 403 || r.status === 429) { blocked = true; continue }
      if (!r.ok) continue
      const html = await r.text()
      const parsed = parseLetterboxd(html)
      // Nur echte Filmseiten akzeptieren (nach dem Redirect auf /film/…)
      if (!/letterboxd\.com\/film\//.test(r.url) && parsed.rating == null) continue
      return send(res, 200, { ...parsed, url: r.url }, 86400)
    } catch {
      blocked = true
    }
  }

  if (blocked) return send(res, 502, { rating: null, error: 'unavailable' }, 300)
  return send(res, 404, { rating: null, error: 'not-found' }, 21600)
}
