import { useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Download, Trash2, ArrowUpCircle, Loader2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/index.ts'
import { useTableState } from '@/libs/list/index.ts'
import {
  usePackagesList,
  useInstallPackage,
  useRemovePackage,
  useUpgradePackages,
  type IPackage,
} from './_apis/index.ts'

export const Route = createFileRoute('/_app/packages/')({
  component: PackagesPage,
})

function PackagesPage() {
  const [state, setState] = useTableState({ pageSize: 20 })
  const { data, isLoading, isFetching, refetch } = usePackagesList(state)
  const { mutate: install, isPending: installing } = useInstallPackage()
  const { mutate: remove, isPending: removing } = useRemovePackage()
  const { mutate: upgrade, isPending: upgrading } = useUpgradePackages()

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const manager = data?.manager ?? ''

  const columns = useMemo<ColumnDef<IPackage>[]>(() => [
    {
      id: 'name',
      header: 'Package',
      accessorKey: 'name',
      cell: ({ getValue }) => (
        <span className='font-mono text-xs font-medium' style={{ color: 'var(--text)' }}>{getValue<string>()}</span>
      ),
    },
    {
      id: 'version',
      header: 'Version',
      accessorKey: 'version',
      cell: ({ getValue }) => (
        <span className='font-mono text-xs' style={{ color: 'var(--text-muted)' }}>{getValue<string>() || '—'}</span>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className='text-xs truncate block max-w-md' style={{ color: 'var(--text-muted)' }}>
          {getValue<string | null>() || '—'}
        </span>
      ),
    },
    {
      id: 'installed',
      header: 'Action',
      accessorKey: 'installed',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.installed ? (
          <button
            disabled={removing}
            onClick={() => remove(row.original.name, { onSuccess: () => refetch() })}
            className='flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60'
            style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
          >
            {removing ? <Loader2 className='size-3 animate-spin' /> : <Trash2 className='size-3' />}
            Remove
          </button>
        ) : (
          <button
            disabled={installing}
            onClick={() => install(row.original.name, { onSuccess: () => refetch() })}
            className='flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60'
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {installing ? <Loader2 className='size-3 animate-spin' /> : <Download className='size-3' />}
            Install
          </button>
        ),
    },
  ], [installing, removing, refetch, install, remove])

  const toolbar = (
    <button
      disabled={upgrading}
      onClick={() => upgrade(undefined, { onSuccess: () => refetch() })}
      className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60'
      style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--border)' }}
    >
      {upgrading ? <Loader2 className='size-4 animate-spin' /> : <ArrowUpCircle className='size-4' />}
      Upgrade all
    </button>
  )

  return (
    <div className='space-y-3'>
      {manager && (
        <p className='text-xs' style={{ color: 'var(--text-muted)' }}>
          Package manager: <span className='font-mono font-semibold' style={{ color: 'var(--accent)' }}>{manager}</span>
          {' · '}{total} {state.search ? 'match' : 'installed'}{total !== 1 ? 'es' : ''}
        </p>
      )}
      <DataTable<IPackage>
        columns={columns}
        data={items}
        total={total}
        state={state}
        onStateChange={setState}
        isLoading={isLoading}
        isFetching={isFetching}
        searchPlaceholder='Search packages (empty = installed)…'
        emptyMessage={state.search ? 'No packages match' : 'No packages installed'}
        rowKey={(p) => p.name}
        toolbar={toolbar}
      />
    </div>
  )
}
