type Status = 'active' | 'inactive' | 'failed' | 'activating' | 'completed' | 'progress' | 'pending' | string

const presets: Record<string, { bg: string; color: string }> = {
  active:     { bg: 'var(--success-soft)',  color: 'var(--success)' },
  completed:  { bg: 'var(--success-soft)',  color: 'var(--success)' },
  inactive:   { bg: 'var(--bg-elevated)',   color: 'var(--text-muted)' },
  failed:     { bg: 'var(--danger-soft)',   color: 'var(--danger)' },
  pending:    { bg: 'var(--danger-soft)',   color: 'var(--danger)' },
  activating: { bg: 'var(--warning-soft)',  color: 'var(--warning)' },
  progress:   { bg: 'var(--warning-soft)',  color: 'var(--warning)' },
  'in progress': { bg: 'var(--warning-soft)', color: 'var(--warning)' },
}

interface BadgeProps {
  status: Status
  dot?: boolean
  label?: string
}

export function Badge({ status, dot = true, label }: BadgeProps) {
  const key = status.toLowerCase()
  const { bg, color } = presets[key] ?? { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' }
  const text = label ?? status

  return (
    <span
      className='inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold'
      style={{ background: bg, color }}
    >
      {dot && <span className='h-1.5 w-1.5 rounded-full shrink-0' style={{ background: color }} />}
      {text}
    </span>
  )
}
