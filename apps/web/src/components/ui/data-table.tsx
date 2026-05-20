import { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { SearchInput } from './search-input.tsx'

export interface IDataTableState {
  pageIndex: number
  pageSize: number
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  search: string
}

interface IDataTableProps<T> {
  columns: ColumnDef<T, any>[]
  data: T[]
  total: number
  state: IDataTableState
  onStateChange: (next: IDataTableState) => void
  isLoading?: boolean
  isFetching?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  toolbar?: React.ReactNode
  pageSizeOptions?: number[]
}

export function DataTable<T>({
  columns,
  data,
  total,
  state,
  onStateChange,
  isLoading = false,
  isFetching = false,
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results',
  rowKey,
  onRowClick,
  toolbar,
  pageSizeOptions = [10, 20, 50, 100],
}: IDataTableProps<T>) {
  const [searchDraft, setSearchDraft] = useState(state.search)

  useEffect(() => {
    setSearchDraft(state.search)
  }, [state.search])

  useEffect(() => {
    if (searchDraft === state.search) return
    const id = setTimeout(() => {
      onStateChange({ ...state, search: searchDraft, pageIndex: 0 })
    }, 300)
    return () => clearTimeout(id)
  }, [searchDraft])

  const pagination = useMemo<PaginationState>(
    () => ({ pageIndex: state.pageIndex, pageSize: state.pageSize }),
    [state.pageIndex, state.pageSize]
  )

  const sorting = useMemo<SortingState>(
    () =>
      state.sortField
        ? [{ id: state.sortField, desc: state.sortDirection === 'desc' }]
        : [],
    [state.sortField, state.sortDirection]
  )

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === 'function' ? updater(pagination) : updater
    onStateChange({ ...state, pageIndex: next.pageIndex, pageSize: next.pageSize })
  }

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater
    const first = next[0]
    onStateChange({
      ...state,
      sortField: first?.id,
      sortDirection: first ? (first.desc ? 'desc' : 'asc') : undefined,
      pageIndex: 0,
    })
  }

  const pageCount = Math.max(1, Math.ceil(total / state.pageSize))

  const table = useReactTable({
    data,
    columns,
    state: { pagination, sorting },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
    onPaginationChange,
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
  })

  const colCount = table.getAllLeafColumns().length

  const start = total === 0 ? 0 : state.pageIndex * state.pageSize + 1
  const end = Math.min(total, (state.pageIndex + 1) * state.pageSize)

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center gap-3'>
        <SearchInput
          value={searchDraft}
          onChange={setSearchDraft}
          placeholder={searchPlaceholder}
          className='flex-1 min-w-[200px] max-w-md'
        />
        {toolbar}
      </div>

      <div
        className='overflow-x-auto'
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-island)',
          boxShadow: 'var(--shadow-island)',
        }}
      >
        <table className='w-full text-sm'>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr
                key={hg.id}
                style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
              >
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const dir = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      className='px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest select-none'
                      style={{
                        color: 'var(--text-muted)',
                        width: header.getSize() === 150 ? undefined : header.getSize(),
                        cursor: canSort ? 'pointer' : 'default',
                      }}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <span className='inline-flex items-center gap-1.5'>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          dir === 'asc' ? <ArrowUp className='size-3' /> :
                          dir === 'desc' ? <ArrowDown className='size-3' /> :
                          <ArrowUpDown className='size-3 opacity-40' />
                        )}
                      </span>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {Array.from({ length: colCount }).map((_, j) => (
                    <td key={j} className='px-5 py-3.5'>
                      <div
                        className='h-4 animate-pulse rounded-full'
                        style={{ background: 'var(--bg-elevated)', width: `${30 + (j * 17) % 50}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className='px-5 py-16 text-center text-sm'
                  style={{ color: 'var(--text-muted)' }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={rowKey(row.original)}
                  className='transition-colors'
                  style={{
                    borderBottom: '1px solid var(--border)',
                    cursor: onRowClick ? 'pointer' : 'default',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className='px-5 py-3.5'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-xs' style={{ color: 'var(--text-muted)' }}>
          {isFetching && !isLoading && <span className='mr-2'>refreshing…</span>}
          {total === 0 ? '0 results' : `${start}–${end} of ${total}`}
        </p>
        <div className='flex items-center gap-2'>
          <select
            value={state.pageSize}
            onChange={(e) =>
              onStateChange({ ...state, pageSize: Number(e.target.value), pageIndex: 0 })
            }
            className='rounded-lg px-2 py-1.5 text-xs outline-none cursor-pointer'
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt} / page</option>
            ))}
          </select>
          <div className='flex items-center gap-1'>
            <button
              disabled={state.pageIndex === 0}
              onClick={() => onStateChange({ ...state, pageIndex: state.pageIndex - 1 })}
              className='flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40'
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
              aria-label='Previous page'
            >
              <ChevronLeft className='size-4' />
            </button>
            <span className='px-2 text-xs font-medium' style={{ color: 'var(--text-muted)' }}>
              {state.pageIndex + 1} / {pageCount}
            </span>
            <button
              disabled={state.pageIndex + 1 >= pageCount}
              onClick={() => onStateChange({ ...state, pageIndex: state.pageIndex + 1 })}
              className='flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40'
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
              aria-label='Next page'
            >
              <ChevronRight className='size-4' />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
