export type SystemdService = {
  name: string
  load: string
  active: string
  sub: string
  description: string
}

export type DockerContainer = {
  id: string
  name: string
  image: string
  status: string
  ports: string
  created: string
}

export type ProcessInfo = {
  pid: number
  name: string
  cpu_usage: number
  memory_kb: number
  status: string
}

export type NginxSite = {
  name: string
  config_file: string
  server_names: string[]
  listen_ports: string[]
  enabled: boolean
}

export type PortInfo = {
  protocol: string
  local_address: string
  local_port: number
  state: string
  process: string | null
}

export type Resources = {
  cpu_usage: number
  memory_total: number
  memory_used: number
  memory_percent: number
  disk_total: number
  disk_used: number
  disk_percent: number
  load_avg_1: number
  load_avg_5: number
  load_avg_15: number
  uptime_seconds: number
}

export type Services = {
  systemd: SystemdService[]
  docker: DockerContainer[]
  processes: ProcessInfo[]
  nginx: NginxSite[]
}
