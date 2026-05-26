// ScoreRing — circular score indicator component
// Props: score (0-100), size (px), locked (bool), unscored (bool)

export function ScoreRing({ score = 0, size = 44, locked = false, unscored = false }) {
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const pct = locked || unscored ? 0 : Math.min(100, Math.max(0, score))
  const offset = circumference - (pct / 100) * circumference

  const color = locked ? '#636B80'
    : unscored ? '#636B80'
    : pct >= 70 ? '#22C55E'
    : pct >= 40 ? '#F59E0B'
    : '#EF4444'

  const label = locked ? '🔒'
    : unscored ? '—'
    : `${Math.round(pct)}%`

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#2E3344" strokeWidth={4}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size < 40 ? 9 : 11, fontWeight: 700,
        color: locked || unscored ? '#636B80' : color,
        letterSpacing: '-0.3px'
      }}>
        {label}
      </div>
    </div>
  )
}

export default ScoreRing
