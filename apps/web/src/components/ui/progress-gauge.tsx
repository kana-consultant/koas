interface ProgressGaugeProps {
  value: number
  label?: string
  size?: number
}

export function ProgressGauge({ value, label = 'Complete', size = 160 }: ProgressGaugeProps) {
  const r = (size / 2) * 0.72
  const cx = size / 2
  const cy = size / 2
  const startAngle = -210
  const totalArc = 240

  function polar(angleDeg: number, radius: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    }
  }

  function arcPath(startDeg: number, endDeg: number, radius: number) {
    const s = polar(startDeg, radius)
    const e = polar(endDeg, radius)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const endAngle = startAngle + (totalArc * value) / 100
  const strokeW = size * 0.09

  return (
    <div className='flex flex-col items-center'>
      <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible', marginBottom: -size * 0.25 }}>
        {/* Track — dashed */}
        <path
          d={arcPath(startAngle, startAngle + totalArc, r)}
          fill='none'
          stroke='var(--border-strong)'
          strokeWidth={strokeW}
          strokeLinecap='round'
          strokeDasharray='4 4'
        />
        {/* Progress — dark green */}
        <path
          d={arcPath(startAngle, Math.min(endAngle, startAngle + totalArc - 0.01), r)}
          fill='none'
          stroke='var(--accent)'
          strokeWidth={strokeW}
          strokeLinecap='round'
        />
        {/* Light green tip */}
        {value > 5 && (
          <path
            d={arcPath(endAngle - 18, Math.min(endAngle, startAngle + totalArc - 0.01), r)}
            fill='none'
            stroke='var(--accent-light)'
            strokeWidth={strokeW}
            strokeLinecap='round'
          />
        )}
        {/* Center text */}
        <text x={cx} y={cy + 8} textAnchor='middle' fontSize={size * 0.18} fontWeight='700' fill='var(--text)'>
          {value}%
        </text>
        <text x={cx} y={cy + 26} textAnchor='middle' fontSize={size * 0.09} fill='var(--text-muted)'>
          {label}
        </text>
      </svg>
    </div>
  )
}
