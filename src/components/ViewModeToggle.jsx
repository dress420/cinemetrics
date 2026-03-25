import './ViewModeToggle.css'

export default function ViewModeToggle({ mode, onToggle }) {
  return (
    <button
      className="vmt-btn"
      onClick={onToggle}
      title={mode === 'desktop' ? 'Switch to Mobile View' : 'Switch to Desktop View'}
    >
      {mode === 'desktop' ? '📱' : '🖥️'}
    </button>
  )
}
