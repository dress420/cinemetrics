import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { House, Library, WandSparkles, Clapperboard, Ellipsis, X, Monitor } from 'lucide-react'
import { NAV_GROUPS } from '../lib/nav'
import Logo from './Logo'
import './MobileNav.css'

const TABS = [
  { to: '/',              label: 'Home',    icon: House },
  { to: '/library',       label: 'Library', icon: Library },
  { to: '/vibes',         label: 'Vibes',   icon: WandSparkles },
  { to: '/tonights-pick', label: 'Pick',    icon: Clapperboard },
]
const TAB_PATHS = new Set(TABS.map(t => t.to))

export default function MobileNav({ filmCount, onToggleMode }) {
  const [showMore, setShowMore] = useState(false)
  const location = useLocation()

  // Menü schließen, sobald sich die Route ändert
  useEffect(() => { setShowMore(false) }, [location.pathname])

  const moreActive = !TAB_PATHS.has(location.pathname)

  return (
    <>
      {showMore && (
        <div className="mob-more-overlay" onClick={() => setShowMore(false)}>
          <div className="mob-more-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-label="All sections">
            <div className="mob-more-handle" />
            <div className="mob-more-header">
              <Logo size={26} />
              <button className="mob-more-close" onClick={() => setShowMore(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="mob-more-scroll">
              {NAV_GROUPS.map(group => {
                const items = group.items.filter(i => !TAB_PATHS.has(i.to))
                if (!items.length) return null
                return (
                  <div key={group.section} className="mob-more-group">
                    <div className="mob-more-section">{group.section}</div>
                    <div className="mob-more-grid">
                      {items.map(({ to, label, icon: Icon, badge }) => (
                        <NavLink
                          key={to}
                          to={to}
                          className={({ isActive }) => `mob-more-item${isActive ? ' active' : ''}`}
                        >
                          <span className="mob-more-icon"><Icon size={18} strokeWidth={1.75} /></span>
                          <span className="mob-more-label">{label}</span>
                          {badge && filmCount > 0 && <span className="mob-more-badge">{filmCount}</span>}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )
              })}
              <button className="mob-more-mode" onClick={onToggleMode}>
                <Monitor size={16} strokeWidth={1.75} />
                Switch to desktop view
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="mob-nav" aria-label="Main navigation">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `mob-tab${isActive && !showMore ? ' active' : ''}`}
          >
            <Icon size={21} strokeWidth={1.75} />
            <span className="mob-tab-label">{label}</span>
          </NavLink>
        ))}
        <button
          className={`mob-tab${showMore || moreActive ? ' active' : ''}`}
          onClick={() => setShowMore(v => !v)}
          aria-expanded={showMore}
        >
          <Ellipsis size={21} strokeWidth={1.75} />
          <span className="mob-tab-label">More</span>
        </button>
      </nav>
    </>
  )
}
