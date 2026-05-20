import { useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, Trash2, Wifi, Loader2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/index.ts'
import { useTableState } from '@/libs/list/index.ts'
import { useMachinesList, useDeleteMachine, useTestMachine, type IMachine } from './_apis/index.ts'

export const Route = createFileRoute('/_app/machines/')({
  component: MachinesPage,
})

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

function MachinesPage() {
  const navigate = useNavigate()
  const [state, setState] = useTableState({ pageSize: 20 })
  const { data, isLoading, isFetching, refetch } = useMachinesList(state)
  const { mutate: deleteMachine, isPending: deleting } = useDeleteMachine()
  const { mutate: testMachine, isPending: testing } = useTestMachine()

  const items = data?.items ?? []
  const total = data?.total ?? 0

  const columns = useMemo<ColumnDef<IMachine>[]>(() => [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div>
          <p className='font-semibold' style={{ color: 'var(--text)' }}>{row.original.name}</p>
          {row.original.description && (
            <p className='mt-0.5 text-xs' style={{ color: 'var(--text-muted)' }}>{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      id: 'host',
      header: 'Host',
      accessorKey: 'host',
      cell: ({ row }) => (
        <span className='font-mono text-xs' style={{ color: 'var(--text-muted)' }}>
          {row.original.host}:{row.original.port}
        </span>
      ),
    },
    {
      id: 'username',
      header: 'User',
      accessorKey: 'username',
      cell: ({ getValue }) => (
        <span className='font-mono text-xs' style={{ color: 'var(--text-muted)' }}>{getValue<string>()}</span>
      ),
    },
    {
      id: 'tags',
      header: 'Tags',
      enableSorting: false,
      cell: ({ row }) => (
        <div className='flex flex-wrap gap-1'>
          {(row.original.tags ?? []).map((tag) => (
            <span key={tag} className='rounded-md px-2 py-0.5 text-[11px]' style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              {tag}
            </span>
          ))}
          {(row.original.tags ?? []).length === 0 && <span className='text-xs' style={{ color: 'var(--text-muted)' }}>—</span>}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => statusDot(getValue<string>() ?? 'unknown'),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <div className='flex items-center gap-1.5' onClick={(e) => e.stopPropagation()}>
          <button
            disabled={testing}
            onClick={() => testMachine(row.original.id, { onSuccess: () => refetch() })}
            className='flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60'
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--border)' }}
          >
            {testing ? <Loader2 className='size-3.5 animate-spin' /> : <Wifi className='size-3.5' />}
            Test
          </button>
          <button
            disabled={deleting}
            onClick={() => {
              if (confirm(`Remove ${row.original.name}?`)) {
                deleteMachine(row.original.id, { onSuccess: () => refetch() })
              }
            }}
            className='flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60'
            style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid var(--border)' }}
            aria-label='Delete machine'
          >
            {deleting ? <Loader2 className='size-3.5 animate-spin' /> : <Trash2 className='size-3.5' />}
          </button>
        </div>
      ),
    },
  ], [testing, deleting, refetch, testMachine, deleteMachine])

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <p className='text-sm' style={{ color: 'var(--text-muted)' }}>
          {total} machine{total !== 1 ? 's' : ''} registered
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

      <DataTable<IMachine>
        columns={columns}
        data={items}
        total={total}
        state={state}
        onStateChange={setState}
        isLoading={isLoading}
        isFetching={isFetching}
        searchPlaceholder='Search machines by name, host, user, tag…'
        emptyMessage='No machines yet. Click "Add machine" to register one.'
        rowKey={(m) => m.id}
      />
    </div>
  )
}
