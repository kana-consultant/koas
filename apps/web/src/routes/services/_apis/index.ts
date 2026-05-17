import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/libs/api/client'

export const serviceKeys = {
  all: () => ['system', 'services'] as const,
  list: () => [...serviceKeys.all(), 'list'] as const,
  detail: (name: string) => [...serviceKeys.all(), name] as const,
  logs: (name: string) => [...serviceKeys.detail(name), 'logs'] as const,
}

export function useSystemServices() {
  return useQuery({
    queryKey: serviceKeys.list(),
    queryFn: () => api.get('/system/services').then((r) => r.data.services),
    refetchInterval: 10_000,
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
