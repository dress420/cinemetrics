import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import AddFilmModal from './components/AddFilmModal'
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
import ComingSoon from './pages/ComingSoon'
import { supabase } from './lib/supabase'

export default function App() {
  const [showAdd, setShowAdd]       = useState(false)
  const [filmCount, setFilmCount]   = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => { loadCount() }, [refreshKey])

  const loadCount = async () => {
    const { count } = await supabase.from('films').select('*', { count: 'exact', head: true })
    setFilmCount(count || 0)
  }

  const handleAdded = () => setRefreshKey((k) => k + 1)
  const openAdd = () => setShowAdd(true)

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar filmCount={filmCount} />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', minWidth: 0 }}>
        <Routes>
          <Route path="/"                element={<Dashboard      key={refreshKey} onAddFilm={openAdd} refreshKey={refreshKey} />} />
          <Route path="/library"         element={<Library        key={refreshKey} onAddFilm={openAdd} refreshKey={refreshKey} />} />
          <Route path="/watchlist"       element={<Watchlist      onAddFilm={openAdd} />} />
          <Route path="/watching"        element={<Watching       onAddFilm={openAdd} />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/mood"            element={<MoodEngine />} />
          <Route path="/gems"            element={<HiddenGems />} />
          <Route path="/rabbit-hole"     element={<RabbitHole />} />
          <Route path="/dna"             element={<DNA />} />
          <Route path="/stats"           element={<Stats />} />
          <Route path="/heatmap"         element={<ComingSoon title="Actor Heatmap"     icon="▣" />} />
          <Route path="/franchise"       element={<ComingSoon title="Franchise Tracker" icon="⊞" />} />
          <Route path="/import"          element={<ComingSoon title="Import / Export"   icon="◧" />} />
          <Route path="/watchparty"      element={<ComingSoon title="Watchparty"        icon="⟳" />} />
        </Routes>
      </div>

      {showAdd && (
        <AddFilmModal onClose={() => setShowAdd(false)} onAdded={handleAdded} />
      )}
    </div>
  )
}
