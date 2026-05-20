import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/libs/api/client'
import { toListParams, type Page } from '@/libs/list'
import type { DataTableState } from '@/components/ui/DataTable'

export interface Package {
  name: string
  version: string
  description?: string | null
  installed: boolean
}

export interface PackagesPage extends Page<Package> {
  manager: string
}

export const packageKeys = {
  all: () => ['packages'] as const,
  list: (params?: unknown) => [...packageKeys.all(), 'list', params] as const,
}

export function usePackages(state: DataTableState) {
  const params = toListParams(state)
  return useQuery({
    queryKey: packageKeys.list(params),
    queryFn: () => api.get<PackagesPage>('/system/packages', { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
  })
}

export function useInstallPackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.post('/system/packages', { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: packageKeys.all() }),
  })
}

export function useRemovePackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.delete(`/system/packages/${name}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: packageKeys.all() }),
  })
}

export function useUpgradePackages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/system/packages/upgrade'),
    onSuccess: () => qc.invalidateQueries({ queryKey: packageKeys.all() }),
  })
}
