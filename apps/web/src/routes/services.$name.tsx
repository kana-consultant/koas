import { useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Play, Square, RotateCcw, RefreshCw } from 'lucide-react'
import { useServiceDetail, useServiceAction, useServiceLogs } from './services.$name/_apis'

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-start justify-between gap-4 py-2.5' style={{ borderBottom: '1px solid var(--border)' }}>
      <span className='text-xs font-medium' style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className='text-xs font-mono text-right' style={{ color: 'var(--text)' }}>{value || '—'}</span>
    </div>
  )
}

function badge(state: string) {
  const map: Record<string, [string, string]> = {
    active: ['var(--success-soft)', 'var(--success)'],
    inactive: ['var(--bg-elevated)', 'var(--text-muted)'],
    failed: ['var(--danger-soft)', 'var(--danger)'],
    activating: ['var(--warning-soft)', 'var(--warning)'],
  }
  const [bg, color] = map[state] ?? ['var(--bg-elevated)', 'var(--text-muted)']
  return (
    <span className='inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium' style={{ background: bg, color }}>
      <span className='h-1.5 w-1.5 rounded-full' style={{ background: color }} />
      {state}
    </span>
  )
}

export function ServiceDetailPage() {
  const { name } = useParams({ from: '/app/services/$name' as any })
  const navigate = useNavigate()
  const { data: svc, isLoading, refetch } = useServiceDetail(name)
  const { mutate: action, isPending } = useServiceAction()
  const { data: logs } = useServiceLogs(name)

  const s = svc as any

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center gap-3'>
        <button
          onClick={() => navigate({ to: '/services' })}
          className='rounded-lg p-2 transition-colors'
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <ArrowLeft className='size-4' />
        </button>
        <div className='flex-1'>
          <h2 className='font-mono text-base font-semibold' style={{ color: 'var(--text)' }}>{name}</h2>
          {s && <p className='text-xs mt-0.5' style={{ color: 'var(--text-muted)' }}>{s.description}</p>}
        </div>
        <button
          onClick={() => refetch()}
          className='rounded-lg p-2 transition-colors'
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <RefreshCw className='size-4' />
        </button>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        {/* Status card */}
        <div className='p-5' style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-island)', boxShadow: 'var(--shadow-island)' }}>
          <div className='mb-4 flex items-center justify-between'>
            <h3 className='text-sm font-semibold' style={{ color: 'var(--text)' }}>Status</h3>
            {s && badge(s.active_state)}
          </div>
          {isLoading ? (
            <div className='space-y-3'>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className='h-4 animate-pulse rounded' style={{ background: 'var(--bg-elevated)' }} />
              ))}
            </div>
          ) : s ? (
            <div>
              <StatRow label='Active state' value={s.active_state} />
              <StatRow label='Sub state' value={s.sub_state} />
              <StatRow label='Load state' value={s.load_state} />
              <StatRow label='PID' value={s.main_pid ? String(s.main_pid) : '—'} />
              <StatRow label='Memory' value={s.memory_current ? `${Math.round(s.memory_current / 1024 / 1024)} MB` : '—'} />
              <StatRow label='Fragment path' value={s.fragment_path} />
            </div>
          ) : null}

          {/* Actions */}
          <div className='mt-5 flex gap-2'>
            {[
              { act: 'start', Icon: Play, label: 'Start', color: 'var(--success)' },
              { act: 'stop', Icon: Square, label: 'Stop', color: 'var(--danger)' },
              { act: 'restart', Icon: RotateCcw, label: 'Restart', color: 'var(--warning)' },
            ].map(({ act, Icon, label, color }) => (
              <button
                key={act}
                disabled={isPending}
                onClick={() => action({ name, action: act }, { onSuccess: () => refetch() })}
                className='flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-colors disabled:opacity-60'
                style={{ background: color + '20', color, border: `1px solid ${color}40` }}
              >
                <Icon className='size-3.5' />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Logs */}
        <div className='p-5' style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-island)', boxShadow: 'var(--shadow-island)' }}>
          <h3 className='mb-3 text-sm font-semibold' style={{ color: 'var(--text)' }}>Recent logs</h3>
          <div
            className='overflow-y-auto rounded-lg p-3 font-mono text-[11px] leading-relaxed'
            style={{ background: 'var(--bg)', maxHeight: '320px', color: 'var(--text-muted)' }}
          >
            {(logs as any[])?.length ? (
              (logs as any[]).map((entry: any, i: number) => (
                <div key={i} className='flex gap-3'>
                  <span className='shrink-0 opacity-50'>{entry.timestamp}</span>
                  <span style={{ color: entry.level === 'error' ? 'var(--danger)' : 'var(--text-muted)' }}>{entry.message}</span>
                </div>
              ))
            ) : (
              <span className='opacity-50'>No log entries</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
