import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/libs/api/client.ts'
import { toListParams, type IPage, type IDataTableState } from '@/libs/list/index.ts'

export interface IMachine {
  id: string
  name: string
  description?: string | null
  host: string
  port: number
  username: string
  tags: string[]
  status: string
  last_seen?: string | null
  created_at: string
  updated_at: string
}

export interface ICreateMachineInput {
  name: string
  description?: string | null
  host: string
  port: number
  username: string
  auth: { type: 'password'; password: string } | { type: 'key_file'; path: string; passphrase: string | null }
  tags: string[]
}

export const machineKeys = {
  all: () => ['machines'] as const,
  list: (params?: unknown) => [...machineKeys.all(), 'list', params] as const,
  detail: (id: string) => [...machineKeys.all(), 'detail', id] as const,
}

export function useMachinesList(state: IDataTableState) {
  const params = toListParams(state)
  return useQuery({
    queryKey: machineKeys.list(params),
    queryFn: () => api.get<IPage<IMachine>>('/machines', { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
  })
}

export function useCreateMachine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateMachineInput) =>
      api.post<IMachine>('/machines', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: machineKeys.all() }),
  })
}

export function useDeleteMachine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/machines/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: machineKeys.all() }),
  })
}

export function useTestMachine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/machines/${id}/test`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: machineKeys.all() }),
  })
}
