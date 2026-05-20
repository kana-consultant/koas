import { useQuery } from '@tanstack/react-query'
import { api } from '@/libs/api/client.ts'
import type { IPage } from '@/libs/list/index.ts'
import type { IServiceInfo } from '../../services/_apis/index.ts'
import type { IMachine } from '../../machines/_apis/index.ts'
import type { IPackagesPage } from '../../packages/_apis/index.ts'

export const dashboardKeys = {
  all: () => ['dashboard'] as const,
  servicesOverview: () => [...dashboardKeys.all(), 'services'] as const,
  machinesOverview: () => [...dashboardKeys.all(), 'machines'] as const,
  packagesOverview: () => [...dashboardKeys.all(), 'packages'] as const,
}

export function useServicesOverview() {
  return useQuery({
    queryKey: dashboardKeys.servicesOverview(),
    queryFn: () =>
      api
        .get<IPage<IServiceInfo>>('/system/services', { params: { page: 1, page_size: 200 } })
        .then((r) => r.data),
    refetchInterval: 10_000,
  })
}

export function useMachinesOverview() {
  return useQuery({
    queryKey: dashboardKeys.machinesOverview(),
    queryFn: () =>
      api
        .get<IPage<IMachine>>('/machines', { params: { page: 1, page_size: 200 } })
        .then((r) => r.data),
  })
}

export function usePackagesOverview() {
  return useQuery({
    queryKey: dashboardKeys.packagesOverview(),
    queryFn: () =>
      api
        .get<IPackagesPage>('/system/packages', { params: { page: 1, page_size: 1 } })
        .then((r) => r.data),
  })
}

export { useSystemInfo, systemKeys, type ISystemInfo } from '../../_apis/system.ts'
