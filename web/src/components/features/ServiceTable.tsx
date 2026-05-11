import { Badge } from '@/components/ui/Badge'
import { StatusDot } from '@/components/ui/StatusDot'
import type { DockerContainer, NginxSite, ProcessInfo, SystemdService } from '@/apis/agent'

function activeBadge(active: string) {
  if (active === 'active') return <Badge variant="green">{active}</Badge>
  if (active === 'failed') return <Badge variant="red">{active}</Badge>
  return <Badge variant="yellow">{active}</Badge>
}

type SystemdProps = { data: SystemdService[] }
export function SystemdTable({ data }: SystemdProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
            <th className="pb-2 pr-4">Service</th>
            <th className="pb-2 pr-4">Load</th>
            <th className="pb-2 pr-4">Active</th>
            <th className="pb-2 pr-4">Sub</th>
            <th className="pb-2">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {data.map((s) => (
            <tr key={s.name} className="group hover:bg-zinc-900/50">
              <td className="py-2 pr-4 text-zinc-300">{s.name}</td>
              <td className="py-2 pr-4">{activeBadge(s.load)}</td>
              <td className="py-2 pr-4">
                <span className="flex items-center gap-2">
                  <StatusDot active={s.active === 'active'} />
                  {s.active}
                </span>
              </td>
              <td className="py-2 pr-4 text-zinc-400">{s.sub}</td>
              <td className="py-2 text-zinc-500">{s.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type DockerProps = { data: DockerContainer[] }
export function DockerTable({ data }: DockerProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
            <th className="pb-2 pr-4">ID</th>
            <th className="pb-2 pr-4">Name</th>
            <th className="pb-2 pr-4">Image</th>
            <th className="pb-2 pr-4">Status</th>
            <th className="pb-2">Ports</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {data.map((c) => (
            <tr key={c.id} className="hover:bg-zinc-900/50">
              <td className="py-2 pr-4 text-zinc-500">{c.id.slice(0, 12)}</td>
              <td className="py-2 pr-4 text-zinc-300">{c.name}</td>
              <td className="py-2 pr-4 text-zinc-400">{c.image}</td>
              <td className="py-2 pr-4">
                <Badge variant={c.status.startsWith('Up') ? 'green' : 'red'}>{c.status}</Badge>
              </td>
              <td className="py-2 text-zinc-500">{c.ports || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type ProcessProps = { data: ProcessInfo[] }
export function ProcessTable({ data }: ProcessProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
            <th className="pb-2 pr-4">PID</th>
            <th className="pb-2 pr-4">Name</th>
            <th className="pb-2 pr-4">CPU%</th>
            <th className="pb-2 pr-4">MEM</th>
            <th className="pb-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {data.map((p) => (
            <tr key={p.pid} className="hover:bg-zinc-900/50">
              <td className="py-2 pr-4 text-zinc-500">{p.pid}</td>
              <td className="py-2 pr-4 text-zinc-300">{p.name}</td>
              <td className="py-2 pr-4">
                <span className={p.cpu_usage > 10 ? 'text-yellow-400' : 'text-zinc-400'}>
                  {p.cpu_usage.toFixed(1)}%
                </span>
              </td>
              <td className="py-2 pr-4 text-zinc-400">{(p.memory_kb / 1024).toFixed(0)} MB</td>
              <td className="py-2 text-zinc-500">{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type NginxProps = { data: NginxSite[] }
export function NginxTable({ data }: NginxProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
            <th className="pb-2 pr-4">Site</th>
            <th className="pb-2 pr-4">Server Names</th>
            <th className="pb-2 pr-4">Ports</th>
            <th className="pb-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {data.map((s) => (
            <tr key={s.name} className="hover:bg-zinc-900/50">
              <td className="py-2 pr-4 text-zinc-300">{s.name}</td>
              <td className="py-2 pr-4 text-zinc-400">{s.server_names.join(', ') || '—'}</td>
              <td className="py-2 pr-4 text-zinc-400">{s.listen_ports.join(', ') || '—'}</td>
              <td className="py-2">
                <Badge variant={s.enabled ? 'green' : 'zinc'}>
                  {s.enabled ? 'enabled' : 'disabled'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
