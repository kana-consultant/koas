import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

// Auth
export function useLogin() {
  return useMutation({
    mutationFn: (creds: { username: string; password: string }) =>
      api.post<{ token: string }>('/auth/login', creds).then((r) => r.data),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => qc.clear(),
  })
}

// System
export function useSystemInfo() {
  return useQuery({ queryKey: ['system', 'info'], queryFn: () => api.get('/system/info').then((r) => r.data) })
}

export function useSystemServices() {
  return useQuery({
    queryKey: ['system', 'services'],
    queryFn: () => api.get('/system/services').then((r) => r.data.services),
    refetchInterval: 10_000,
  })
}

export function useServiceDetail(name: string) {
  return useQuery({
    queryKey: ['system', 'services', name],
    queryFn: () => api.get(`/system/services/${name}`).then((r) => r.data),
    enabled: !!name,
  })
}

export function useServiceAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, action }: { name: string; action: string }) =>
      api.post(`/system/services/${name}/action`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system', 'services'] }),
  })
}

export function useServiceLogs(name: string) {
  return useQuery({
    queryKey: ['system', 'services', name, 'logs'],
    queryFn: () => api.get(`/system/services/${name}/logs`).then((r) => r.data.logs),
    refetchInterval: 5_000,
  })
}

// Packages
export function usePackages() {
  return useQuery({
    queryKey: ['packages'],
    queryFn: () => api.get('/system/packages').then((r) => r.data),
  })
}

export function usePackageSearch(q: string) {
  return useQuery({
    queryKey: ['packages', 'search', q],
    queryFn: () => api.get('/system/packages/search', { params: { q } }).then((r) => r.data.results),
    enabled: q.length > 1,
  })
}

export function useInstallPackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.post('/system/packages', { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  })
}

export function useRemovePackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.delete(`/system/packages/${name}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  })
}

export function useUpgradePackages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/system/packages/upgrade'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  })
}

// Machines
export function useMachines() {
  return useQuery({ queryKey: ['machines'], queryFn: () => api.get('/machines').then((r) => r.data.machines) })
}

export function useMachine(id: string) {
  return useQuery({
    queryKey: ['machines', id],
    queryFn: () => api.get(`/machines/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateMachine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/machines', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['machines'] }),
  })
}

export function useDeleteMachine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/machines/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['machines'] }),
  })
}

export function useTestMachine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/machines/${id}/test`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['machines'] }),
  })
}
