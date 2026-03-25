import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import './MobileNav.css'

const MAIN_TABS = [
  { to: '/', label: 'Home', icon: '⬡' },
  { to: '/library', label: 'Library', icon: '◈' },
  { to: '/vibes', label: 'Vibes', icon: '✦' },
  { to: '/tonights-pick', label: 'Pick', icon: '🎯' },
  { to: '#menu', label: 'More', icon: '☰' },
]

const MORE_ITEMS = [
  { section: 'CORE', items: [
    { to: '/watchlist', label: 'Watchlist', icon: '◎' },
    { to: '/watching', label: 'Watching', icon: '◷' },
  ]},
  { section: 'DISCOVERY', items: [
    { to: '/nl-search', label: 'AI Search', icon: '⟁' },
    { to: '/mood', label: 'Mood Engine', icon: '◬' },
    { to: '/recommendations', label: 'Recommendations', icon: '⟁' },
    { to: '/gems', label: 'Hidden Gems', icon: '💎' },
    { to: '/rabbit-hole', label: 'Rabbit Hole', icon: '⊙' },
    { to: '/two-player', label: 'Two-Player', icon: '⚔' },
    { to: '/time-budget', label: 'Time Budget', icon: '⏱' },
    { to: '/streaming', label: 'Streaming', icon: '📡' },
  ]},
  { section: 'ANALYTICS', items: [
    { to: '/dna', label: 'DNA Profile', icon: '▦' },
    { to: '/stats', label: 'Stats', icon: '◫' },
    { to: '/heatmap', label: 'Actor Heatmap', icon: '▣' },
  ]},
  { section: 'TOOLS', items: [
    { to: '/franchise', label: 'Franchise', icon: '⊞' },
    { to: '/import', label: 'Import / Export', icon: '◧' },
  ]},
]

export default function MobileNav({ filmCount }) {
  const [showMore, setShowMore] = useState(false)
  const location = useLocation()

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname.startsWith(to)
  }

  const handleTabClick = (to) => {
    if (to === '#menu') {
      setShowMore(v => !v)
    } else {
      setShowMore(false)
    }
  }

  return (
    <>
      {showMore && (
        <div className="mob-more-overlay" onClick={() => setShowMore(false)}>
          <div className="mob-more-sheet" onClick={e => e.stopPropagation()}>
            <div className="mob-more-handle" />
            <div className="mob-more-header">
              <span className="mob-more-title">CINE<span style={{ color: 'var(--accent)' }}>METRICS</span></span>
              <button className="mob-more-close" onClick={() => setShowMore(false)}>✕</button>
            </div>
            <div className="mob-more-scroll">
              {MORE_ITEMS.map(group => (
                <div key={group.section} className="mob-more-group">
                  <div className="mob-more-section mono">{group.section}</div>
                  {group.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={`mob-more-item${isActive(item.to) ? ' active' : ''}`}
                      onClick={() => setShowMore(false)}
                    >
                      <span className="mob-more-icon">{item.icon}</span>
                      <span>{item.label}</span>
                      {item.to === '/library' && filmCount > 0 && (
                        <span className="mob-more-badge mono">{filmCount}</span>
                      )}
                    </NavLink>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="mob-nav">
        {MAIN_TABS.map(tab => (
          tab.to === '#menu' ? (
            <button
              key="menu"
              className={`mob-tab${showMore ? ' active' : ''}`}
              onClick={() => handleTabClick('#menu')}
            >
              <span className="mob-tab-icon">{tab.icon}</span>
              <span className="mob-tab-label">{tab.label}</span>
            </button>
          ) : (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) => `mob-tab${isActive ? ' active' : ''}`}
              onClick={() => setShowMore(false)}
            >
              <span className="mob-tab-icon">{tab.icon}</span>
              <span className="mob-tab-label">{tab.label}</span>
            </NavLink>
          )
        ))}
      </nav>
    </>
  )
}
