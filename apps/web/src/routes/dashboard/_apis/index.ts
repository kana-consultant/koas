import { useQuery } from '@tanstack/react-query'
import { api } from '@/libs/api/client'
import type { Page } from '@/libs/list'
import type { ServiceInfo } from '../../services/_apis'
import type { Machine } from '../../machines/_apis'
import type { PackagesPage } from '../../packages/_apis'

export const systemKeys = {
  all: () => ['system'] as const,
  info: () => [...systemKeys.all(), 'info'] as const,
  servicesOverview: () => [...systemKeys.all(), 'services', 'overview'] as const,
}

export const dashboardMachineKeys = {
  overview: () => ['machines', 'overview'] as const,
}

export const dashboardPackageKeys = {
  overview: () => ['packages', 'overview'] as const,
}

export function useSystemInfo() {
  return useQuery({
    queryKey: systemKeys.info(),
    queryFn: () => api.get('/system/info').then((r) => r.data),
  })
}

export function useSystemServices() {
  return useQuery({
    queryKey: systemKeys.servicesOverview(),
    queryFn: () =>
      api
        .get<Page<ServiceInfo>>('/system/services', { params: { page: 1, page_size: 200 } })
        .then((r) => r.data),
    refetchInterval: 10_000,
  })
}

export function useMachines() {
  return useQuery({
    queryKey: dashboardMachineKeys.overview(),
    queryFn: () =>
      api
        .get<Page<Machine>>('/machines', { params: { page: 1, page_size: 200 } })
        .then((r) => r.data),
  })
}

export function usePackages() {
  return useQuery({
    queryKey: dashboardPackageKeys.overview(),
    queryFn: () =>
      api
        .get<PackagesPage>('/system/packages', { params: { page: 1, page_size: 1 } })
        .then((r) => r.data),
  })
}
