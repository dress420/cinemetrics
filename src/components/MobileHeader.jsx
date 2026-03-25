import './MobileHeader.css'

export default function MobileHeader({ onSearch, onAdd }) {
  return (
    <header className="mob-header">
      <div className="mob-header-logo">
        CINE<span>METRICS</span>
      </div>
      <div className="mob-header-actions">
        <button className="mob-header-btn" onClick={onSearch} title="Search">⌘</button>
        <button className="mob-header-btn add" onClick={onAdd} title="Add film">+</button>
      </div>
    </header>
  )
}
