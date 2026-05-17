import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/libs/api/client'

export const machineKeys = {
  all: () => ['machines'] as const,
  list: () => [...machineKeys.all(), 'list'] as const,
  detail: (id: string) => [...machineKeys.all(), id] as const,
}

export function useMachines() {
  return useQuery({
    queryKey: machineKeys.list(),
    queryFn: () => api.get('/machines').then((r) => r.data.machines),
  })
}

export function useCreateMachine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => api.post('/machines', data).then((r) => r.data),
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
