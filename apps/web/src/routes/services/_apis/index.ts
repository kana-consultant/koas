import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/libs/api/client'
import { toListParams, type Page } from '@/libs/list'
import type { DataTableState } from '@/components/ui/DataTable'

export interface ServiceInfo {
  name: string
  description: string
  active_state: string
  sub_state: string
  load_state: string
  enabled: boolean
  main_pid?: number | null
  memory_bytes?: number | null
}

export const serviceKeys = {
  all: () => ['system', 'services'] as const,
  list: (params?: unknown) => [...serviceKeys.all(), 'list', params] as const,
  detail: (name: string) => [...serviceKeys.all(), name] as const,
  logs: (name: string) => [...serviceKeys.detail(name), 'logs'] as const,
}

export function useSystemServices(state: DataTableState, stateFilter?: string) {
  const params = { ...toListParams(state), state: stateFilter || undefined }
  return useQuery({
    queryKey: serviceKeys.list(params),
    queryFn: () => api.get<Page<ServiceInfo>>('/system/services', { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
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
