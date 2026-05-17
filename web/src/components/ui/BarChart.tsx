interface Bar {
  label: string
  value: number
  highlighted?: boolean
}

interface BarChartProps {
  bars: Bar[]
  highlightLabel?: string
  className?: string
}

export function BarChart({ bars, className = '' }: BarChartProps) {
  const max = Math.max(...bars.map((b) => b.value), 1)

  return (
    <div className={`flex items-end justify-between gap-2 ${className}`} style={{ height: '160px' }}>
      {bars.map((bar, i) => {
        const pct = (bar.value / max) * 100
        const isHighlighted = bar.highlighted

        return (
          <div key={i} className='flex flex-1 flex-col items-center gap-2'>
            {/* Tooltip on highlight */}
            {isHighlighted && (
              <span
                className='rounded-lg px-2 py-0.5 text-[10px] font-semibold'
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {bar.value}%
              </span>
            )}
            {!isHighlighted && <span className='h-5' />}

            {/* Pill bar */}
            <div className='relative flex w-full flex-col items-center' style={{ height: '120px', justifyContent: 'flex-end' }}>
              <div
                className='w-full rounded-full transition-all'
                style={{
                  height: `${Math.max(pct, 8)}%`,
                  background: isHighlighted
                    ? 'var(--accent)'
                    : pct > 50
                    ? 'var(--accent-light)'
                    : 'transparent',
                  border: isHighlighted || pct > 50 ? 'none' : '2px dashed var(--border-strong)',
                  maxWidth: '36px',
                  minHeight: '12px',
                }}
              />
            </div>

            {/* Day label */}
            <span className='text-[11px] font-medium' style={{ color: 'var(--text-muted)' }}>
              {bar.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
