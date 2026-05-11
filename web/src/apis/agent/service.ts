import { apiClient } from '@/libs/axios'
import type {
  DockerContainer,
  NginxSite,
  PortInfo,
  ProcessInfo,
  Resources,
  SystemdService,
} from './types'

const base = (serverId: string) => `/proxy/${serverId}`

export const agentService = {
  systemd: (id: string) =>
    apiClient.get<SystemdService[]>(`${base(id)}/services/systemd`),
  docker: (id: string) =>
    apiClient.get<DockerContainer[]>(`${base(id)}/services/docker`),
  processes: (id: string) =>
    apiClient.get<ProcessInfo[]>(`${base(id)}/services/processes`),
  nginx: (id: string) =>
    apiClient.get<NginxSite[]>(`${base(id)}/services/nginx`),
  ports: (id: string) =>
    apiClient.get<PortInfo[]>(`${base(id)}/ports`),
  resources: (id: string) =>
    apiClient.get<Resources>(`${base(id)}/resources`),
}
