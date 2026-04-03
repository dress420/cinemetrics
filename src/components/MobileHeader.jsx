import './MobileHeader.css'

export default function MobileHeader({ onSearch, onAdd }) {
  return (
    <header className="mob-header">
      <div className="mob-header-logo">
        CINE<span>METRICS</span>
      </div>
      <div className="mob-header-actions">
        <button className="mob-header-btn" onClick={onSearch} title="Search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
        <button className="mob-header-btn add" onClick={onAdd} title="Add film">+</button>
      </div>
    </header>
  )
}
