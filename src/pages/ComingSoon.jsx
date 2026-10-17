import { Film } from 'lucide-react'
import './ComingSoon.css'

export default function ComingSoon({ title, sub = 'This page does not exist (yet).' }) {
  return (
    <div className="coming-soon">
      <div className="empty-state">
        <div className="empty-state-icon"><Film size={24} strokeWidth={1.6} /></div>
        <div className="empty-state-title">{title}</div>
        <div className="empty-state-sub">{sub}</div>
      </div>
    </div>
  )
}
