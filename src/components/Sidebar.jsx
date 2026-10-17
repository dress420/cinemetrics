import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Search, Plus, Smartphone } from 'lucide-react'
import { NAV_GROUPS } from '../lib/nav'
import { LogoMark } from './Logo'
import './Sidebar.css'

// Schmale Icon-Leiste (Ember-Layout). Labels erscheinen als Tooltip beim Hovern.
export default function Sidebar({ filmCount, onSearch, onAdd, onToggleMode }) {
  const [tip, setTip] = useState(null)

  const showTip = (label) => (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    setTip({ label, top: r.top + r.height / 2 })
  }
  const hideTip = () => setTip(null)
  const tipProps = (label) => ({
    onMouseEnter: showTip(label),
    onMouseLeave: hideTip,
    onFocus: showTip(label),
    onBlur: hideTip,
    'aria-label': label,
  })

  return (
    <aside className="rail">
      <NavLink to="/" className="rail-logo" {...tipProps('CineMetrics')}>
        <LogoMark size={36} />
      </NavLink>

      <div className="rail-actions">
        <button className="rail-item" onClick={onSearch} {...tipProps('Search  ⌘K')}>
          <Search size={19} strokeWidth={1.75} />
        </button>
        <button className="rail-item rail-item-add" onClick={onAdd} {...tipProps('Add film')}>
          <Plus size={19} strokeWidth={2} />
        </button>
      </div>

      <nav className="rail-nav" onScroll={hideTip}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.section} className="rail-group">
            {gi > 0 && <div className="rail-sep" />}
            {group.items.map(({ to, label, icon: Icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `rail-item${isActive ? ' active' : ''}`}
                {...tipProps(badge && filmCount ? `${label} · ${filmCount}` : label)}
              >
                <Icon size={19} strokeWidth={1.75} />
                {badge && filmCount > 0 && <span className="rail-dot" />}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="rail-footer">
        <button className="rail-item" onClick={onToggleMode} {...tipProps('Mobile view')}>
          <Smartphone size={18} strokeWidth={1.75} />
        </button>
        <div className="rail-avatar" {...tipProps('dress420')} tabIndex={0}>D</div>
      </div>

      {tip && (
        <div className="rail-tip" style={{ top: tip.top }} role="tooltip">
          {tip.label}
        </div>
      )}
    </aside>
  )
}
