import { useQuery } from '@tanstack/react-query'
import { api } from '@/libs/api/client.ts'

export interface ISystemInfo {
  hostname: string
  os_name: string
  os_version: string
  os_family: string
  kernel: string
  arch: string
  uptime_seconds: number
}

export const systemKeys = {
  all: () => ['system'] as const,
  info: () => [...systemKeys.all(), 'info'] as const,
}

export function useSystemInfo() {
  return useQuery({
    queryKey: systemKeys.info(),
    queryFn: () => api.get<ISystemInfo>('/system/info').then((r) => r.data),
  })
}
