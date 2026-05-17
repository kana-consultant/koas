import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/libs/api/client'

export const serviceKeys = {
  all: () => ['system', 'services'] as const,
  detail: (name: string) => [...serviceKeys.all(), name] as const,
  logs: (name: string) => [...serviceKeys.detail(name), 'logs'] as const,
}

export function useServiceDetail(name: string) {
  return useQuery({
    queryKey: serviceKeys.detail(name),
    queryFn: () => api.get(`/system/services/${name}`).then((r) => r.data),
    enabled: !!name,
  })
}

export function useServiceLogs(name: string) {
  return useQuery({
    queryKey: serviceKeys.logs(name),
    queryFn: () => api.get(`/system/services/${name}/logs`).then((r) => r.data.logs),
    refetchInterval: 5_000,
  })
}

export function useServiceAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, action }: { name: string; action: string }) =>
      api.post(`/system/services/${name}/action`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all() }),
  })
}
