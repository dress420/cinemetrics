import { Link } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import Logo from './Logo'
import './MobileHeader.css'

export default function MobileHeader({ onSearch, onAdd }) {
  return (
    <header className="mob-header">
      <Link to="/" className="mob-header-logo"><Logo size={28} /></Link>
      <div className="mob-header-actions">
        <button className="mob-header-btn" onClick={onSearch} aria-label="Search">
          <Search size={18} strokeWidth={2} />
        </button>
        <button className="mob-header-btn add" onClick={onAdd} aria-label="Add film">
          <Plus size={20} strokeWidth={2.25} />
        </button>
      </div>
    </header>
  )
}
