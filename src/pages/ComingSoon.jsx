import './ComingSoon.css'

export default function ComingSoon({ title, icon = '◈', phase = '2' }) {
  return (
    <div className="coming-soon">
      <div className="cs-icon">{icon}</div>
      <div className="cs-title">{title}</div>
      <div className="cs-sub">Coming in Phase {phase}</div>
    </div>
  )
}
