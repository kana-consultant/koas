import { ArrowUpRight } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  trend?: string
  dark?: boolean
  onClick?: () => void
}

export function StatCard({ label, value, trend, dark, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-5 flex flex-col justify-between min-h-[140px] ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        background: dark ? 'var(--accent)' : 'var(--bg-surface)',
        borderRadius: 'var(--radius-island)',
        boxShadow: 'var(--shadow-island)',
      }}
    >
      <div className='flex items-start justify-between gap-2'>
        <p
          className='text-sm font-medium leading-tight'
          style={{ color: dark ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)' }}
        >
          {label}
        </p>
        <button
          className='shrink-0 flex items-center justify-center h-8 w-8 rounded-full transition-colors'
          style={{
            background: dark ? 'rgba(255,255,255,0.15)' : 'transparent',
            border: dark ? 'none' : '1.5px solid var(--border-strong)',
            color: dark ? '#fff' : 'var(--text)',
          }}
        >
          <ArrowUpRight className='size-3.5' />
        </button>
      </div>

      <div>
        <p
          className='text-4xl font-bold tracking-tight'
          style={{ color: dark ? '#fff' : 'var(--text)' }}
        >
          {value}
        </p>
        {trend && (
          <p
            className='mt-2 flex items-center gap-1.5 text-xs font-medium'
            style={{ color: dark ? 'rgba(255,255,255,0.7)' : 'var(--success)' }}
          >
            <span
              className='inline-flex items-center justify-center rounded-md px-1.5 py-0.5'
              style={{ background: dark ? 'rgba(255,255,255,0.15)' : 'var(--success-soft)' }}
            >
              ↑
            </span>
            {trend}
          </p>
        )}
      </div>
    </div>
  )
}
