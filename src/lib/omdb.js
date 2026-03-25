const API_KEY = import.meta.env.VITE_OMDB_API_KEY

export async function getOMDBData(title, year) {
  const url = new URL('https://www.omdbapi.com/')
  url.searchParams.set('apikey', API_KEY)
  url.searchParams.set('t', title)
  if (year) url.searchParams.set('y', year)
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (data.Response === 'False') return null
    const rt = (data.Ratings || []).find(r => r.Source === 'Rotten Tomatoes')
    return {
      imdbRating: data.imdbRating !== 'N/A' ? parseFloat(data.imdbRating) : null,
      imdbVotes: data.imdbVotes !== 'N/A' ? data.imdbVotes : null,
      rtRating: rt ? parseInt(rt.Value) : null,
      metacritic: data.Metascore !== 'N/A' ? parseInt(data.Metascore) : null,
      rated: data.Rated,
      awards: data.Awards,
      boxOffice: data.BoxOffice,
    }
  } catch { return null }
}
