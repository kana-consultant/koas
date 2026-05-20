import { useState } from 'react'
import type { IDataTableState } from '@/components/ui/data-table.tsx'

export type { IDataTableState }

export interface IListParams {
  page: number
  page_size: number
  sort?: string
  search?: string
}

export interface IPage<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export function toListParams(state: IDataTableState): IListParams {
  const params: IListParams = {
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

export const defaultTableState: IDataTableState = {
  pageIndex: 0,
  pageSize: 20,
  search: '',
}

export function useTableState(initial: Partial<IDataTableState> = {}) {
  return useState<IDataTableState>({ ...defaultTableState, ...initial })
}
