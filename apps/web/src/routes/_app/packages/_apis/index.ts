import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/libs/api/client.ts'
import { toListParams, type IPage, type IDataTableState } from '@/libs/list/index.ts'

export interface IPackage {
  name: string
  version: string
  description?: string | null
  installed: boolean
}

export interface IPackagesPage extends IPage<IPackage> {
  manager: string
}

export const packageKeys = {
  all: () => ['packages'] as const,
  list: (params?: unknown) => [...packageKeys.all(), 'list', params] as const,
}

export function usePackagesList(state: IDataTableState) {
  const params = toListParams(state)
  return useQuery({
    queryKey: packageKeys.list(params),
    queryFn: () => api.get<IPackagesPage>('/system/packages', { params }).then((r) => r.data),
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
