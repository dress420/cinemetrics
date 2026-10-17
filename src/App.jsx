import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import MobileHeader from './components/MobileHeader'
import AddFilmModal from './components/AddFilmModal'
import QuickSearch from './components/QuickSearch'
import FilmDetailPanel from './components/FilmDetailPanel'
import Dashboard from './pages/Dashboard'
import Library from './pages/Library'
import Watchlist from './pages/Watchlist'
import Watching from './pages/Watching'
import Recommendations from './pages/Recommendations'
import MoodEngine from './pages/MoodEngine'
import HiddenGems from './pages/HiddenGems'
import RabbitHole from './pages/RabbitHole'
import Stats from './pages/Stats'
import NLSearch from './pages/NLSearch'
import TwoPlayer from './pages/TwoPlayer'
import Franchise from './pages/Franchise'
import Streaming from './pages/Streaming'
import ActorHeatmap from './pages/ActorHeatmap'
import ImportExport from './pages/ImportExport'
import ComingSoon from './pages/ComingSoon'
import { supabase } from './lib/supabase'

function getInitialMode() {
  try {
    const saved = localStorage.getItem('cinemetrics-viewmode')
    if (saved === 'mobile' || saved === 'desktop') return saved
  } catch {}
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const w = window.innerWidth
  return (w <= 640 || (isTouch && w <= 900)) ? 'mobile' : 'desktop'
}

export default function App() {
  const [viewMode, setViewMode]         = useState(getInitialMode)
  const [showAdd, setShowAdd]           = useState(false)
  const [addPreselect, setAddPreselect] = useState(null)
  const [showSearch, setShowSearch]     = useState(false)
  const [detailFilm, setDetailFilm]     = useState(null)
  const [filmCount, setFilmCount]       = useState(0)
  const [refreshKey, setRefreshKey]     = useState(0)
  const mainRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  const isMobile = viewMode === 'mobile'

  useEffect(() => { loadCount() }, [refreshKey])

  // App-Shortcut "/?search=1" öffnet direkt die Suche
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('search') === '1') {
      setShowSearch(true)
      navigate(location.pathname, { replace: true })
    }
  }, [location.search])

  // Beim Seitenwechsel wieder nach oben scrollen
  useEffect(() => { mainRef.current?.scrollTo(0, 0) }, [location.pathname])

  // Globaler Handler: jede Karte kann das Detail-Panel öffnen
  useEffect(() => {
    window.__cinemetrics_openfilm = (film) => setDetailFilm(film)
    return () => { delete window.__cinemetrics_openfilm }
  }, [])

  // Cmd/Ctrl+K → Schnellsuche
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setShowSearch(s => !s)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const loadCount = async () => {
    const { count } = await supabase.from('films').select('*', { count: 'exact', head: true })
    setFilmCount(count || 0)
  }

  const toggleMode = () => {
    const next = isMobile ? 'desktop' : 'mobile'
    setViewMode(next)
    try { localStorage.setItem('cinemetrics-viewmode', next) } catch {}
  }

  const handleAdded = () => setRefreshKey(k => k + 1)
  const openAdd = (preselect) => { setAddPreselect(preselect || null); setShowAdd(true) }
  const openSearch = () => setShowSearch(true)
  const handleFilmClick = (film) => setDetailFilm(film)
  const handleAddFromDetail = (film) => { setDetailFilm(null); openAdd(film) }

  return (
    <div className={`app ${isMobile ? 'mobile-mode' : 'desktop-mode'}`}>
      {!isMobile && (
        <Sidebar
          filmCount={filmCount}
          onSearch={openSearch}
          onAdd={() => openAdd()}
          onToggleMode={toggleMode}
        />
      )}
      {isMobile && <MobileHeader onSearch={openSearch} onAdd={() => openAdd()} />}

      <main className="app-main" ref={mainRef}>
        <Routes>
          <Route path="/"                element={<Dashboard key={refreshKey} onAddFilm={() => openAdd()} onSearch={openSearch} onFilmClick={handleFilmClick} isMobile={isMobile} />} />
          <Route path="/library"         element={<Library   key={refreshKey} onAddFilm={() => openAdd()} refreshKey={refreshKey} />} />
          <Route path="/watchlist"       element={<Watchlist onAddFilm={() => openAdd()} />} />
          <Route path="/watching"        element={<Watching  onAddFilm={() => openAdd()} />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/mood"            element={<MoodEngine />} />
          <Route path="/gems"            element={<HiddenGems />} />
          <Route path="/rabbit-hole"     element={<RabbitHole />} />
          <Route path="/nl-search"       element={<NLSearch />} />
          <Route path="/two-player"      element={<TwoPlayer />} />
          <Route path="/stats"           element={<Stats />} />
          <Route path="/heatmap"         element={<ActorHeatmap />} />
          <Route path="/franchise"       element={<Franchise />} />
          <Route path="/streaming"       element={<Streaming />} />
          <Route path="/import"          element={<ImportExport />} />
          {/* entfernte Seiten → Startseite (z. B. alte Lesezeichen) */}
          {['/vibes', '/tonights-pick', '/time-budget', '/dna', '/watchparty'].map(p => (
            <Route key={p} path={p} element={<Navigate to="/" replace />} />
          ))}
          <Route path="*"                element={<ComingSoon title="Page not found" />} />
        </Routes>
      </main>

      {isMobile && <MobileNav filmCount={filmCount} onToggleMode={toggleMode} onSearch={openSearch} />}

      {showSearch && (
        <QuickSearch onClose={() => setShowSearch(false)} onSelect={(film) => { setShowSearch(false); handleFilmClick(film) }} />
      )}
      {detailFilm && (
        <FilmDetailPanel film={detailFilm} onClose={() => setDetailFilm(null)} onAdd={handleAddFromDetail} onOpenFilm={setDetailFilm} />
      )}
      {showAdd && (
        <AddFilmModal onClose={() => { setShowAdd(false); setAddPreselect(null) }} onAdded={handleAdded} preselect={addPreselect} />
      )}
    </div>
  )
}
