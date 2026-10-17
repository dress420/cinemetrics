const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'
export const IMG_BASE = 'https://image.tmdb.org/t/p/w500'
export const IMG_THUMB = 'https://image.tmdb.org/t/p/w200'
export const IMG_BACKDROP = 'https://image.tmdb.org/t/p/w1280'

const get = async (path, params = {}) => {
  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('language', 'en-US')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url)
  return res.json()
}

export const searchMulti    = (query) => get('/search/multi', { query, include_adult: false })
// external_ids liefert die IMDb-ID (auch für Serien) → exakte Bewertungen über OMDb
export const getMovie       = (id) => get(`/movie/${id}`, { append_to_response: 'credits,videos,similar,external_ids' })
export const getTVShow      = (id) => get(`/tv/${id}`, { append_to_response: 'credits,videos,similar,external_ids' })
export const getTrending    = (type = 'all') => get(`/trending/${type}/week`)
export const getTopRated    = (type = 'movie') => get(`/${type}/top_rated`)
export const getNowPlaying  = () => get('/movie/now_playing')
export const discoverMovies = (params) => get('/discover/movie', params)
