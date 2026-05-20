import { useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Play, Square, RotateCcw } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge, DataTable } from '@/components/ui/index.ts'
import { useTableState } from '@/libs/list/index.ts'
import { useServicesList, useServiceAction, type IServiceInfo } from './_apis/index.ts'

export const Route = createFileRoute('/_app/services/')({
  component: ServicesPage,
})

const STATE_FILTERS = ['all', 'active', 'inactive', 'failed'] as const
type TStateFilter = typeof STATE_FILTERS[number]

function ServicesPage() {
  const navigate = useNavigate()
  const [state, setState] = useTableState({ pageSize: 20 })
  const [stateFilter, setStateFilter] = useState<TStateFilter>('all')
  const { data, isLoading, isFetching } = useServicesList(state, stateFilter === 'all' ? undefined : stateFilter)
  const { mutate: action } = useServiceAction()

  const items = data?.items ?? []
  const total = data?.total ?? 0

  const columns = useMemo<ColumnDef<IServiceInfo>[]>(() => [
    {
      id: 'name',
      header: 'Service',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div>
          <p className='font-mono text-xs font-semibold' style={{ color: 'var(--text)' }}>{row.original.name}</p>
          {row.original.description && (
            <p className='mt-0.5 text-xs truncate max-w-md' style={{ color: 'var(--text-muted)' }}>{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      id: 'active_state',
      header: 'Status',
      accessorKey: 'active_state',
      cell: ({ getValue }) => <Badge status={getValue<string>()} />,
    },
    {
      id: 'sub_state',
      header: 'Sub-state',
      accessorKey: 'sub_state',
      cell: ({ getValue }) => (
        <span className='text-xs' style={{ color: 'var(--text-muted)' }}>{getValue<string>()}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <div className='flex items-center gap-1.5' onClick={(e) => e.stopPropagation()}>
          {[
            { act: 'start', Icon: Play, color: 'var(--success)' },
            { act: 'stop', Icon: Square, color: 'var(--danger)' },
            { act: 'restart', Icon: RotateCcw, color: 'var(--warning)' },
          ].map(({ act, Icon, color }) => (
            <button
              key={act}
              title={act}
              onClick={() => action({ name: row.original.name, action: act })}
              className='flex h-7 w-7 items-center justify-center rounded-lg transition-colors'
              style={{ background: color + '20', color }}
            >
              <Icon className='size-3.5' />
            </button>
          ))}
        </div>
      ),
    },
  ], [action])

  const toolbar = (
    <div className='flex gap-2'>
      {STATE_FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => setStateFilter(f)}
          className='rounded-xl px-3 py-2 text-xs font-medium transition-colors capitalize'
          style={{
            background: stateFilter === f ? 'var(--accent)' : 'var(--bg-surface)',
            color: stateFilter === f ? '#fff' : 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}
        >
          {f}
        </button>
      ))}
    </div>
  )

  return (
    <DataTable<IServiceInfo>
      columns={columns}
      data={items}
      total={total}
      state={state}
      onStateChange={setState}
      isLoading={isLoading}
      isFetching={isFetching}
      searchPlaceholder='Search services…'
      emptyMessage='No services found'
      rowKey={(s) => s.name}
      onRowClick={(s) => navigate({ to: '/services/$name', params: { name: s.name } })}
      toolbar={toolbar}
    />
  )
}
