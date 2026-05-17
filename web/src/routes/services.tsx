import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Play, Square, RotateCcw } from 'lucide-react'
import { useSystemServices, useServiceAction } from '@/apis'
import { Badge, SearchInput, Button } from '@/components/ui'

export function ServicesPage() {
  const navigate = useNavigate()
  const { data: services, isLoading } = useSystemServices()
  const { mutate: action } = useServiceAction()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'failed'>('all')

  const filtered = ((services as any[]) ?? []).filter((s: any) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || s.active_state === filter
    return matchSearch && matchFilter
  })

  return (
    <div className='space-y-4'>
      {/* Controls */}
      <div className='flex flex-wrap items-center gap-3'>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder='Search services…'
          className='flex-1 max-w-sm'
        />
        <div className='flex gap-2'>
          {(['all', 'active', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className='rounded-xl px-4 py-2 text-sm font-medium transition-colors capitalize'
              style={{
                background: filter === f ? 'var(--accent)' : 'var(--bg-surface)',
                color: filter === f ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className='overflow-x-auto rounded-2xl' style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <table className='w-full text-sm'>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
              {['Service', 'Status', 'Sub-state', 'Actions'].map((h) => (
                <th key={h} className='px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest' style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {[60, 30, 40, 30].map((w, j) => (
                    <td key={j} className='px-5 py-3.5'>
                      <div className='h-4 animate-pulse rounded-full' style={{ background: 'var(--bg-elevated)', width: `${w}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className='px-5 py-16 text-center text-sm' style={{ color: 'var(--text-muted)' }}>
                  No services found
                </td>
              </tr>
            ) : (
              filtered.map((s: any) => (
                <tr
                  key={s.name}
                  className='cursor-pointer transition-colors hover:bg-opacity-50'
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  onClick={() => navigate({ to: '/services/$name', params: { name: s.name } })}
                >
                  <td className='px-5 py-3.5 font-mono text-xs font-semibold' style={{ color: 'var(--text)' }}>{s.name}</td>
                  <td className='px-5 py-3.5'><Badge status={s.active_state} /></td>
                  <td className='px-5 py-3.5 text-xs' style={{ color: 'var(--text-muted)' }}>{s.sub_state}</td>
                  <td className='px-5 py-3.5'>
                    <div className='flex items-center gap-1.5' onClick={(e) => e.stopPropagation()}>
                      {[
                        { act: 'start', Icon: Play, color: 'var(--success)' },
                        { act: 'stop', Icon: Square, color: 'var(--danger)' },
                        { act: 'restart', Icon: RotateCcw, color: 'var(--warning)' },
                      ].map(({ act, Icon, color }) => (
                        <button
                          key={act}
                          title={act}
                          onClick={() => action({ name: s.name, action: act })}
                          className='flex h-7 w-7 items-center justify-center rounded-lg transition-colors'
                          style={{ background: color + '20', color }}
                        >
                          <Icon className='size-3.5' />
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && (
        <p className='text-right text-xs' style={{ color: 'var(--text-muted)' }}>
          {filtered.length} of {(services as any[])?.length ?? 0} services
        </p>
      )}
    </div>
  )
}
