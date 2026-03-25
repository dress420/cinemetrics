import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import MobileHeader from './components/MobileHeader'
import ViewModeToggle from './components/ViewModeToggle'
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
import DNA from './pages/DNA'
import Stats from './pages/Stats'
import Vibes from './pages/Vibes'
import NLSearch from './pages/NLSearch'
import TonightsPick from './pages/TonightsPick'
import TwoPlayer from './pages/TwoPlayer'
import TimeBudget from './pages/TimeBudget'
import Franchise from './pages/Franchise'
import Streaming from './pages/Streaming'
import ActorHeatmap from './pages/ActorHeatmap'
import ImportExport from './pages/ImportExport'
import ComingSoon from './pages/ComingSoon'
import { supabase } from './lib/supabase'

function getInitialMode() {
  const saved = localStorage.getItem('cinemetrics-viewmode')
  if (saved === 'mobile' || saved === 'desktop') return saved
  return window.innerWidth <= 768 ? 'mobile' : 'desktop'
}

export default function App() {
  const [viewMode, setViewMode]             = useState(getInitialMode)
  const [showAdd, setShowAdd]               = useState(false)
  const [addPreselect, setAddPreselect]     = useState(null)
  const [showSearch, setShowSearch]         = useState(false)
  const [detailFilm, setDetailFilm]         = useState(null)
  const [filmCount, setFilmCount]           = useState(0)
  const [refreshKey, setRefreshKey]         = useState(0)

  const isMobile = viewMode === 'mobile'

  useEffect(() => { loadCount() }, [refreshKey])

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
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
    localStorage.setItem('cinemetrics-viewmode', next)
  }

  const handleAdded = () => setRefreshKey(k => k + 1)
  const openAdd = (preselect) => { setAddPreselect(preselect || null); setShowAdd(true) }
  const handleFilmClick = (film) => setDetailFilm(film)
  const handleAddFromDetail = (film) => { setDetailFilm(null); openAdd(film) }

  const routes = (
    <Routes>
      <Route path="/"                element={<Dashboard      key={refreshKey} onAddFilm={() => openAdd()} refreshKey={refreshKey} onFilmClick={handleFilmClick} />} />
      <Route path="/library"         element={<Library        key={refreshKey} onAddFilm={() => openAdd()} refreshKey={refreshKey} />} />
      <Route path="/watchlist"       element={<Watchlist      onAddFilm={() => openAdd()} />} />
      <Route path="/watching"        element={<Watching       onAddFilm={() => openAdd()} />} />
      <Route path="/recommendations" element={<Recommendations />} />
      <Route path="/mood"            element={<MoodEngine />} />
      <Route path="/gems"            element={<HiddenGems />} />
      <Route path="/rabbit-hole"     element={<RabbitHole />} />
      <Route path="/vibes"           element={<Vibes />} />
      <Route path="/nl-search"       element={<NLSearch />} />
      <Route path="/tonights-pick"   element={<TonightsPick />} />
      <Route path="/two-player"      element={<TwoPlayer />} />
      <Route path="/time-budget"     element={<TimeBudget />} />
      <Route path="/dna"             element={<DNA />} />
      <Route path="/stats"           element={<Stats />} />
      <Route path="/heatmap"         element={<ActorHeatmap />} />
      <Route path="/franchise"       element={<Franchise />} />
      <Route path="/streaming"       element={<Streaming />} />
      <Route path="/import"          element={<ImportExport />} />
      <Route path="/watchparty"      element={<ComingSoon title="Watchparty" icon="⟳" />} />
    </Routes>
  )

  return (
    <div className={isMobile ? 'mobile-mode' : 'desktop-mode'} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', width: '100vw', overflow: 'hidden' }}>

      {/* Desktop: sidebar */}
      {!isMobile && <Sidebar filmCount={filmCount} />}

      {/* Mobile: top header */}
      {isMobile && (
        <MobileHeader
          onSearch={() => setShowSearch(true)}
          onAdd={() => openAdd()}
        />
      )}

      {/* Main content */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        minWidth: 0,
        paddingBottom: isMobile ? '64px' : 0,
      }}>
        {routes}
      </div>

      {/* Mobile: bottom nav */}
      {isMobile && <MobileNav filmCount={filmCount} />}

      {/* Toggle button */}
      <ViewModeToggle mode={viewMode} onToggle={toggleMode} />

      {/* Overlays */}
      {showSearch && (
        <QuickSearch
          onClose={() => setShowSearch(false)}
          onSelect={(film) => { setShowSearch(false); handleFilmClick(film) }}
        />
      )}

      {detailFilm && (
        <FilmDetailPanel
          film={detailFilm}
          onClose={() => setDetailFilm(null)}
          onAdd={handleAddFromDetail}
        />
      )}

      {showAdd && (
        <AddFilmModal
          onClose={() => { setShowAdd(false); setAddPreselect(null) }}
          onAdded={handleAdded}
          preselect={addPreselect}
        />
      )}
    </div>
  )
}
