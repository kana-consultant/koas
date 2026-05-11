import { useQuery } from '@tanstack/react-query'
import { agentService } from './service'

export const agentKeys = {
  server: (id: string) => ['agent', id] as const,
  systemd: (id: string) => [...agentKeys.server(id), 'systemd'] as const,
  docker: (id: string) => [...agentKeys.server(id), 'docker'] as const,
  processes: (id: string) => [...agentKeys.server(id), 'processes'] as const,
  nginx: (id: string) => [...agentKeys.server(id), 'nginx'] as const,
  ports: (id: string) => [...agentKeys.server(id), 'ports'] as const,
  resources: (id: string) => [...agentKeys.server(id), 'resources'] as const,
}

export function useSystemdServices(serverId: string) {
  return useQuery({
    queryKey: agentKeys.systemd(serverId),
    queryFn: () => agentService.systemd(serverId).then((r) => r.data),
    refetchInterval: 10_000,
  })
}

export function useDockerContainers(serverId: string) {
  return useQuery({
    queryKey: agentKeys.docker(serverId),
    queryFn: () => agentService.docker(serverId).then((r) => r.data),
    refetchInterval: 10_000,
  })
}

export function useProcesses(serverId: string) {
  return useQuery({
    queryKey: agentKeys.processes(serverId),
    queryFn: () => agentService.processes(serverId).then((r) => r.data),
    refetchInterval: 5_000,
  })
}

export function useNginxSites(serverId: string) {
  return useQuery({
    queryKey: agentKeys.nginx(serverId),
    queryFn: () => agentService.nginx(serverId).then((r) => r.data),
    refetchInterval: 30_000,
  })
}

export function usePorts(serverId: string) {
  return useQuery({
    queryKey: agentKeys.ports(serverId),
    queryFn: () => agentService.ports(serverId).then((r) => r.data),
    refetchInterval: 15_000,
  })
}

export function useResources(serverId: string) {
  return useQuery({
    queryKey: agentKeys.resources(serverId),
    queryFn: () => agentService.resources(serverId).then((r) => r.data),
    refetchInterval: 5_000,
  })
}
