import './ViewModeToggle.css'

export default function ViewModeToggle({ mode, onToggle }) {
  return (
    <button
      className="vmt-btn"
      onClick={onToggle}
      title={mode === 'desktop' ? 'Switch to Mobile View' : 'Switch to Desktop View'}
    >
      {mode === 'desktop' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="3"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      )}
    </button>
  )
}
