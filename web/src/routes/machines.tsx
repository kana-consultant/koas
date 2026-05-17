import { useNavigate } from '@tanstack/react-router'
import { Plus, Server, Trash2, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { useMachines, useDeleteMachine, useTestMachine } from '@/apis'

function statusDot(status: string) {
  const map: Record<string, [string, string]> = {
    online: ['var(--success-soft)', 'var(--success)'],
    offline: ['var(--bg-elevated)', 'var(--text-muted)'],
    auth_failed: ['var(--danger-soft)', 'var(--danger)'],
    unknown: ['var(--bg-elevated)', 'var(--text-muted)'],
  }
  const [bg, color] = map[status] ?? map.unknown
  return (
    <span className='inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium' style={{ background: bg, color }}>
      <span className='h-1.5 w-1.5 rounded-full' style={{ background: color }} />
      {status.replace('_', ' ')}
    </span>
  )
}

export function MachinesPage() {
  const navigate = useNavigate()
  const { data: machines, isLoading, refetch } = useMachines()
  const { mutate: deleteMachine, isPending: deleting } = useDeleteMachine()
  const { mutate: testMachine, isPending: testing } = useTestMachine()

  const list: any[] = (machines as any[]) ?? []

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <p className='text-sm' style={{ color: 'var(--text-muted)' }}>
          {list.length} machine{list.length !== 1 ? 's' : ''} registered
        </p>
        <button
          onClick={() => navigate({ to: '/machines/new' })}
          className='flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors'
          style={{ background: 'var(--accent)', color: '#0b0f17' }}
        >
          <Plus className='size-4' />
          Add machine
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='rounded-xl p-5' style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className='h-5 w-2/3 animate-pulse rounded' style={{ background: 'var(--bg-elevated)' }} />
              <div className='mt-2 h-4 w-1/2 animate-pulse rounded' style={{ background: 'var(--bg-elevated)' }} />
              <div className='mt-4 h-4 w-1/3 animate-pulse rounded' style={{ background: 'var(--bg-elevated)' }} />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-xl py-20' style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <Server className='mb-3 size-10' style={{ color: 'var(--text-muted)' }} />
          <p className='font-medium' style={{ color: 'var(--text)' }}>No machines yet</p>
          <p className='mt-1 text-sm' style={{ color: 'var(--text-muted)' }}>Add an SSH machine to get started</p>
          <button
            onClick={() => navigate({ to: '/machines/new' })}
            className='mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium'
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            <Plus className='size-4' />
            Add machine
          </button>
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {list.map((m: any) => (
            <div key={m.id} className='rounded-xl p-5' style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className='flex items-start justify-between gap-2'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-9 w-9 items-center justify-center rounded-lg' style={{ background: 'var(--bg-elevated)' }}>
                    <Server className='size-4' style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div>
                    <p className='font-semibold text-sm' style={{ color: 'var(--text)' }}>{m.name}</p>
                    <p className='font-mono text-xs' style={{ color: 'var(--text-muted)' }}>{m.host}:{m.port ?? 22}</p>
                  </div>
                </div>
                {statusDot(m.status ?? 'unknown')}
              </div>

              {m.description && (
                <p className='mt-3 text-xs' style={{ color: 'var(--text-muted)' }}>{m.description}</p>
              )}

              {m.tags?.length > 0 && (
                <div className='mt-3 flex flex-wrap gap-1'>
                  {m.tags.map((tag: string) => (
                    <span key={tag} className='rounded-md px-2 py-0.5 text-[11px]' style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className='mt-4 flex gap-2'>
                <button
                  disabled={testing}
                  onClick={() => testMachine(m.id, { onSuccess: () => refetch() })}
                  className='flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors disabled:opacity-60'
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                >
                  {testing ? <Loader2 className='size-3.5 animate-spin' /> : <Wifi className='size-3.5' />}
                  Test
                </button>
                <button
                  disabled={deleting}
                  onClick={() => {
                    if (confirm(`Remove ${m.name}?`)) {
                      deleteMachine(m.id, { onSuccess: () => refetch() })
                    }
                  }}
                  className='flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60'
                  style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid var(--border)' }}
                >
                  {deleting ? <Loader2 className='size-3.5 animate-spin' /> : <Trash2 className='size-3.5' />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
