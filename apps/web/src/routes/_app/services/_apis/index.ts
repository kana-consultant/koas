import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/libs/api/client.ts'
import { toListParams, type IPage, type IDataTableState } from '@/libs/list/index.ts'

export interface IServiceInfo {
  name: string
  description: string
  active_state: string
  sub_state: string
  load_state: string
  enabled: boolean
  main_pid?: number | null
  memory_bytes?: number | null
  memory_current?: number | null
  fragment_path?: string
}

export interface IServiceLogEntry {
  timestamp: string
  level: string
  message: string
}

export interface IServiceActionInput {
  name: string
  action: string
}

export const serviceKeys = {
  all: () => ['services'] as const,
  list: (params?: unknown) => [...serviceKeys.all(), 'list', params] as const,
  detail: (name: string) => [...serviceKeys.all(), 'detail', name] as const,
  logs: (name: string) => [...serviceKeys.detail(name), 'logs'] as const,
}

export function useServicesList(state: IDataTableState, stateFilter?: string) {
  const params = { ...toListParams(state), state: stateFilter || undefined }
  return useQuery({
    queryKey: serviceKeys.list(params),
    queryFn: () => api.get<IPage<IServiceInfo>>('/system/services', { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
    refetchInterval: 10_000,
  })
}

export function useServiceDetail(name: string) {
  return useQuery({
    queryKey: serviceKeys.detail(name),
    queryFn: () => api.get<IServiceInfo>(`/system/services/${name}`).then((r) => r.data),
    enabled: !!name,
  })
}

export function useServiceLogs(name: string) {
  return useQuery({
    queryKey: serviceKeys.logs(name),
    queryFn: () =>
      api
        .get<{ logs: IServiceLogEntry[] }>(`/system/services/${name}/logs`)
        .then((r) => r.data.logs),
    refetchInterval: 5_000,
  })
}

export function useServiceAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, action }: IServiceActionInput) =>
      api.post(`/system/services/${name}/action`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all() }),
  })
}
