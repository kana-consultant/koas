import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { serversService } from './service'
import type { CreateServerPayload } from './types'

export const serverKeys = {
  all: ['servers'] as const,
  lists: () => [...serverKeys.all, 'list'] as const,
  details: () => [...serverKeys.all, 'detail'] as const,
  detail: (id: string) => [...serverKeys.details(), id] as const,
}

export function useServers() {
  return useQuery({
    queryKey: serverKeys.lists(),
    queryFn: () => serversService.list().then((r) => r.data),
  })
}

export function useServer(id: string) {
  return useQuery({
    queryKey: serverKeys.detail(id),
    queryFn: () => serversService.get(id).then((r) => r.data),
  })
}

export function useCreateServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateServerPayload) => serversService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: serverKeys.lists() }),
  })
}

export function useDeleteServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => serversService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: serverKeys.lists() }),
  })
}
