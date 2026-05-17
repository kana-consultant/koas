import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/libs/api/client'

export const packageKeys = {
  all: () => ['packages'] as const,
  installed: () => [...packageKeys.all(), 'installed'] as const,
  search: (q: string) => [...packageKeys.all(), 'search', q] as const,
}

export function usePackages() {
  return useQuery({
    queryKey: packageKeys.installed(),
    queryFn: () => api.get('/system/packages').then((r) => r.data),
  })
}

export function usePackageSearch(q: string) {
  return useQuery({
    queryKey: packageKeys.search(q),
    queryFn: () => api.get('/system/packages/search', { params: { q } }).then((r) => r.data.results),
    enabled: q.length > 1,
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
