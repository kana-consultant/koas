import { useState } from 'react'
import type { DataTableState } from '@/components/ui/DataTable'

export interface ListParams {
  page: number
  page_size: number
  sort?: string
  search?: string
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export function toListParams(state: DataTableState): ListParams {
  const params: ListParams = {
    page: state.pageIndex + 1,
    page_size: state.pageSize,
  }
  if (state.sortField && state.sortDirection) {
    params.sort = `${state.sortField}:${state.sortDirection}`
  }
  if (state.search.trim()) {
    params.search = state.search.trim()
  }
  return params
}

export const defaultTableState: DataTableState = {
  pageIndex: 0,
  pageSize: 20,
  search: '',
}

export function useTableState(initial: Partial<DataTableState> = {}) {
  return useState<DataTableState>({ ...defaultTableState, ...initial })
}
