import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useDockerContainers, useNginxSites, useProcesses, useSystemdServices } from '@/apis/agent'
import { DockerTable, NginxTable, ProcessTable, SystemdTable } from '@/components/features/ServiceTable'

type Tab = 'systemd' | 'docker' | 'processes' | 'nginx'

export function ServicesPage() {
  const { serverId } = useParams({ from: '/servers/$serverId/services' })
  const [tab, setTab] = useState<Tab>('systemd')

  const systemd = useSystemdServices(serverId)
  const docker = useDockerContainers(serverId)
  const processes = useProcesses(serverId)
  const nginx = useNginxSites(serverId)

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'systemd', label: 'systemd', count: systemd.data?.length ?? 0 },
    { key: 'docker', label: 'docker', count: docker.data?.length ?? 0 },
    { key: 'processes', label: 'processes', count: processes.data?.length ?? 0 },
    { key: 'nginx', label: 'nginx', count: nginx.data?.length ?? 0 },
  ]

  const current =
    tab === 'systemd' ? systemd
    : tab === 'docker' ? docker
    : tab === 'processes' ? processes
    : nginx

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded border px-3 py-1 text-xs font-mono transition-colors ${
              tab === t.key
                ? 'border-zinc-600 bg-zinc-800 text-zinc-100'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-2 text-zinc-600">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        {current.isLoading && (
          <div className="py-8 text-center text-xs text-zinc-600">loading...</div>
        )}
        {current.error && (
          <div className="py-4 text-center text-xs text-red-400">
            Agent unreachable or service not available
          </div>
        )}
        {!current.isLoading && !current.error && tab === 'systemd' && systemd.data && (
          <SystemdTable data={systemd.data} />
        )}
        {!current.isLoading && !current.error && tab === 'docker' && docker.data && (
          <DockerTable data={docker.data} />
        )}
        {!current.isLoading && !current.error && tab === 'processes' && processes.data && (
          <ProcessTable data={processes.data} />
        )}
        {!current.isLoading && !current.error && tab === 'nginx' && nginx.data && (
          <NginxTable data={nginx.data} />
        )}
      </div>
    </div>
  )
}
