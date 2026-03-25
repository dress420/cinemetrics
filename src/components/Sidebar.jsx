import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const nav = [
  {
    section: 'CORE',
    items: [
      { to: '/', label: 'Dashboard', icon: '⬡' },
      { to: '/library', label: 'My Library', icon: '◈', badge: true },
      { to: '/watchlist', label: 'Watchlist', icon: '◎' },
      { to: '/watching', label: 'Watching', icon: '◷' },
    ],
  },
  {
    section: 'DISCOVERY',
    items: [
      { to: '/tonights-pick', label: "Tonight's Pick", icon: '◉' },
      { to: '/nl-search', label: 'AI Search', icon: '⟁' },
      { to: '/vibes', label: 'Vibes', icon: '✦' },
      { to: '/mood', label: 'Mood Engine', icon: '◬' },
      { to: '/recommendations', label: 'Recommendations', icon: '⟐' },
      { to: '/gems', label: 'Hidden Gems', icon: '◇' },
      { to: '/rabbit-hole', label: 'Rabbit Hole', icon: '⊙' },
      { to: '/two-player', label: 'Two-Player', icon: '⚔' },
      { to: '/time-budget', label: 'Time Budget', icon: '⏱' },
      { to: '/streaming', label: 'Streaming', icon: '▸' },
    ],
  },
  {
    section: 'ANALYTICS',
    items: [
      { to: '/dna', label: 'DNA Profile', icon: '▦' },
      { to: '/stats', label: 'Stats & Wrapped', icon: '◫' },
      { to: '/heatmap', label: 'Actor Heatmap', icon: '▣' },
    ],
  },
  {
    section: 'TOOLS',
    items: [
      { to: '/franchise', label: 'Franchise', icon: '⊞' },
      { to: '/import', label: 'Import / Export', icon: '◧' },
    ],
  },
]

export default function Sidebar({ filmCount }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-text">CINE<span>METRICS</span></div>
      </div>

      <nav className="nav">
        {nav.map((group) => (
          <div key={group.section}>
            <div className="nav-section">{group.section}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {item.badge && filmCount > 0 && (
                  <span className="nav-badge">{filmCount}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="search-hint mono">⌘K Quick Search</div>
        <div className="user-pill">
          <div className="user-avatar">D</div>
          <div className="user-name">dress420</div>
        </div>
      </div>
    </aside>
  )
}
