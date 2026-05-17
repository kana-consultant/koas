import { useQuery } from '@tanstack/react-query'
import { api } from '@/libs/api/client'

export const systemKeys = {
  all: () => ['system'] as const,
  info: () => [...systemKeys.all(), 'info'] as const,
  services: () => [...systemKeys.all(), 'services'] as const,
}

export const machineKeys = {
  all: () => ['machines'] as const,
  list: () => [...machineKeys.all(), 'list'] as const,
}

export function useSystemInfo() {
  return useQuery({
    queryKey: systemKeys.info(),
    queryFn: () => api.get('/system/info').then((r) => r.data),
  })
}

export function useSystemServices() {
  return useQuery({
    queryKey: systemKeys.services(),
    queryFn: () => api.get('/system/services').then((r) => r.data.services),
    refetchInterval: 10_000,
  })
}

export function useMachines() {
  return useQuery({
    queryKey: machineKeys.list(),
    queryFn: () => api.get('/machines').then((r) => r.data.machines),
  })
}
