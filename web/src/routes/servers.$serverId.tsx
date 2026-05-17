import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { Tabs, TabsList, TabsTrigger, TabsContent, Badge, Progress, Skeleton } from '@kana-consultant/ui-kit'
import { Cpu, HardDrive, Database, Clock, Activity, CheckCircle2, XCircle } from 'lucide-react'
import {
  useSystemdServices, useDockerContainers, useProcesses, useNginxSites,
  usePorts, useResources,
} from '@/apis/agent'
import type { SystemdService, DockerContainer, ProcessInfo, NginxSite, PortInfo } from '@/apis/agent'

export function ServerPage() {
  const { serverId } = useParams({ from: '/servers/$serverId' })
  const [tab, setTab] = useState('overview')
  const resources = useResources(serverId)

  return (
    <div className='flex flex-col gap-6'>
      <ServerHeader serverId={serverId} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='services'>Services</TabsTrigger>
          <TabsTrigger value='ports'>Ports</TabsTrigger>
        </TabsList>

        <TabsContent value='overview'>
          <ResourcesSection data={resources.data} isLoading={resources.isLoading} />
        </TabsContent>
        <TabsContent value='services'>
          <ServicesSection serverId={serverId} />
        </TabsContent>
        <TabsContent value='ports'>
          <PortsSection serverId={serverId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ServerHeader({ serverId }: { serverId: string }) {
  const { data, isLoading } = useResources(serverId)

  const isOnline = !isLoading && !!data

  return (
    <div className='flex items-center gap-3'>
      <div className='flex items-center gap-2'>
        {isLoading ? (
          <Skeleton className='h-2.5 w-2.5 rounded-full' />
        ) : isOnline ? (
          <CheckCircle2 className='size-4 text-success' />
        ) : (
          <XCircle className='size-4 text-danger' />
        )}
        <span className={[
          'text-xs font-medium',
          isLoading ? 'text-muted-foreground' : isOnline ? 'text-success' : 'text-danger',
        ].join(' ')}>
          {isLoading ? 'Connecting…' : isOnline ? 'All systems operational' : 'Agent unreachable'}
        </span>
      </div>
    </div>
  )
}

function StatBlock({
  label, value, sub, icon: Icon, accent,
}: {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <div className='flex flex-col gap-3 rounded-xl border border-border bg-surface p-5'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-medium uppercase tracking-widest text-muted-foreground'>{label}</span>
        <span className={`rounded-lg p-2 ${accent}`}>
          <Icon className='size-4' />
        </span>
      </div>
      <div>
        <p className='text-3xl font-bold tracking-tight text-foreground'>{value}</p>
        <p className='mt-1 text-xs text-muted-foreground'>{sub}</p>
      </div>
    </div>
  )
}

function ResourcesSection({ data, isLoading }: { data: ReturnType<typeof useResources>['data']; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className='h-36 rounded-xl' />)}
        </div>
      </div>
    )
  }

  if (!data) return (
    <div className='flex h-40 items-center justify-center rounded-xl border border-border bg-surface'>
      <p className='text-sm text-muted-foreground'>Could not load resource metrics</p>
    </div>
  )

  const fmt = (b: number) => {
    const gb = b / 1024 / 1024 / 1024
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(b / 1024 / 1024).toFixed(0)} MB`
  }

  const uptime = (() => {
    const d = Math.floor(data.uptime_seconds / 86400)
    const h = Math.floor((data.uptime_seconds % 86400) / 3600)
    const m = Math.floor((data.uptime_seconds % 3600) / 60)
    if (d > 0) return `${d}d ${h}h`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  })()

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatBlock
          label='CPU Usage'
          value={`${data.cpu_usage.toFixed(1)}%`}
          sub={`Load ${data.load_avg_1.toFixed(2)} · ${data.load_avg_5.toFixed(2)} · ${data.load_avg_15.toFixed(2)}`}
          icon={Cpu}
          accent='bg-primary/10 text-primary'
        />
        <StatBlock
          label='Memory'
          value={fmt(data.memory_used)}
          sub={`of ${fmt(data.memory_total)} · ${data.memory_percent.toFixed(1)}% used`}
          icon={Database}
          accent='bg-primary/10 text-primary'
        />
        <StatBlock
          label='Disk'
          value={`${data.disk_percent.toFixed(1)}%`}
          sub={`${fmt(data.disk_used)} used of ${fmt(data.disk_total)}`}
          icon={HardDrive}
          accent='bg-warning/10 text-warning'
        />
        <StatBlock
          label='Uptime'
          value={uptime}
          sub='System uptime'
          icon={Clock}
          accent='bg-success/10 text-success'
        />
      </div>

      <div className='rounded-xl border border-border bg-surface p-5'>
        <div className='mb-4 flex items-center gap-2'>
          <Activity className='size-4 text-muted-foreground' />
          <span className='text-sm font-medium text-foreground'>Resource utilisation</span>
        </div>
        <div className='space-y-4'>
          <ProgressRow label='CPU' value={data.cpu_usage} tone='primary' />
          <ProgressRow label='Memory' value={data.memory_percent} tone='info' />
          <ProgressRow label='Disk' value={data.disk_percent} tone='warning' />
        </div>
      </div>
    </div>
  )
}

function ProgressRow({ label, value, tone }: { label: string; value: number; tone: 'primary' | 'info' | 'warning' }) {
  return (
    <div className='flex items-center gap-4'>
      <span className='w-16 shrink-0 text-xs text-muted-foreground'>{label}</span>
      <Progress value={value} tone={tone} className='flex-1' />
      <span className='w-12 shrink-0 text-right text-xs tabular-nums text-foreground'>{value.toFixed(1)}%</span>
    </div>
  )
}

function ServicesSection({ serverId }: { serverId: string }) {
  const [sub, setSub] = useState('systemd')
  const systemd = useSystemdServices(serverId)
  const docker = useDockerContainers(serverId)
  const processes = useProcesses(serverId)
  const nginx = useNginxSites(serverId)

  const counts = {
    systemd: systemd.data?.length ?? 0,
    docker: docker.data?.length ?? 0,
    processes: processes.data?.length ?? 0,
    nginx: nginx.data?.length ?? 0,
  }

  const isLoading =
    sub === 'systemd' ? systemd.isLoading
    : sub === 'docker' ? docker.isLoading
    : sub === 'processes' ? processes.isLoading
    : nginx.isLoading

  return (
    <Tabs value={sub} onValueChange={setSub}>
      <TabsList>
        {(['systemd', 'docker', 'processes', 'nginx'] as const).map((s) => (
          <TabsTrigger key={s} value={s}>
            {s}
            {counts[s] > 0 && (
              <Badge tone='neutral' size='sm' className='ml-1.5'>{counts[s]}</Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value='systemd'>
        {isLoading ? <TableSkeleton /> : <SystemdTable data={systemd.data ?? []} />}
      </TabsContent>
      <TabsContent value='docker'>
        {isLoading ? <TableSkeleton /> : <DockerTable data={docker.data ?? []} />}
      </TabsContent>
      <TabsContent value='processes'>
        {isLoading ? <TableSkeleton /> : <ProcessTable data={processes.data ?? []} />}
      </TabsContent>
      <TabsContent value='nginx'>
        {isLoading ? <TableSkeleton /> : <NginxTable data={nginx.data ?? []} />}
      </TabsContent>
    </Tabs>
  )
}

function PortsSection({ serverId }: { serverId: string }) {
  const { data, isLoading } = usePorts(serverId)
  if (isLoading) return <TableSkeleton />
  return <PortTable data={data ?? []} />
}

function TableSkeleton() {
  return (
    <div className='space-y-2 pt-2'>
      {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className='h-10 w-full rounded-lg' />)}
    </div>
  )
}

function SystemdTable({ data }: { data: SystemdService[] }) {
  return (
    <Table>
      <Thead cols={['Service', 'Load', 'Active', 'Sub', 'Description']} />
      <tbody>
        {data.map((s) => (
          <Tr key={s.name}>
            <Td mono>{s.name}</Td>
            <Td><StatusDot active={s.load === 'loaded'} label={s.load} /></Td>
            <Td>
              <Badge
                tone={s.active === 'active' ? 'success' : s.active === 'failed' ? 'danger' : 'warning'}
                dot size='sm'
              >
                {s.active}
              </Badge>
            </Td>
            <Td muted>{s.sub}</Td>
            <Td muted truncate>{s.description}</Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  )
}

function DockerTable({ data }: { data: DockerContainer[] }) {
  return (
    <Table>
      <Thead cols={['ID', 'Name', 'Image', 'Status', 'Ports']} />
      <tbody>
        {data.map((c) => (
          <Tr key={c.id}>
            <Td mono muted>{c.id.slice(0, 12)}</Td>
            <Td mono>{c.name}</Td>
            <Td muted>{c.image}</Td>
            <Td>
              <Badge tone={c.status.startsWith('Up') ? 'success' : 'danger'} dot size='sm'>
                {c.status}
              </Badge>
            </Td>
            <Td muted>{c.ports || '—'}</Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  )
}

function ProcessTable({ data }: { data: ProcessInfo[] }) {
  return (
    <Table>
      <Thead cols={['PID', 'Name', 'CPU%', 'Memory', 'Status']} />
      <tbody>
        {data.map((p) => (
          <Tr key={p.pid}>
            <Td mono muted>{p.pid}</Td>
            <Td mono>{p.name}</Td>
            <Td>
              <span className={[
                'font-mono text-xs tabular-nums',
                p.cpu_usage > 20 ? 'text-danger' : p.cpu_usage > 5 ? 'text-warning' : 'text-muted-foreground',
              ].join(' ')}>
                {p.cpu_usage.toFixed(1)}%
              </span>
            </Td>
            <Td muted>{(p.memory_kb / 1024).toFixed(0)} MB</Td>
            <Td muted>{p.status}</Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  )
}

function NginxTable({ data }: { data: NginxSite[] }) {
  return (
    <Table>
      <Thead cols={['Site', 'Server names', 'Ports', 'Status']} />
      <tbody>
        {data.map((s) => (
          <Tr key={s.name}>
            <Td mono>{s.name}</Td>
            <Td muted>{s.server_names.join(', ') || '—'}</Td>
            <Td muted>{s.listen_ports.join(', ') || '—'}</Td>
            <Td>
              <Badge tone={s.enabled ? 'success' : 'neutral'} dot size='sm'>
                {s.enabled ? 'enabled' : 'disabled'}
              </Badge>
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  )
}

function PortTable({ data }: { data: PortInfo[] }) {
  return (
    <Table>
      <Thead cols={['Proto', 'Address', 'Port', 'State', 'Process']} />
      <tbody>
        {data.map((p, i) => (
          <Tr key={i}>
            <Td>
              <Badge tone={p.protocol === 'tcp' ? 'primary' : 'info'} size='sm'>
                {p.protocol.toUpperCase()}
              </Badge>
            </Td>
            <Td mono muted>{p.local_address}</Td>
            <Td mono>{p.local_port}</Td>
            <Td>
              <Badge tone={p.state === 'LISTEN' ? 'success' : 'neutral'} dot size='sm'>
                {p.state}
              </Badge>
            </Td>
            <Td muted>{p.process ?? '—'}</Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  )
}

function StatusDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span className='flex items-center gap-1.5'>
      <span className={`inline-block size-1.5 rounded-full ${active ? 'bg-success' : 'bg-muted-foreground'}`} />
      <span className='text-xs text-muted-foreground'>{label}</span>
    </span>
  )
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className='overflow-x-auto rounded-xl border border-border bg-surface'>
      <table className='w-full text-sm'>{children}</table>
    </div>
  )
}

function Thead({ cols }: { cols: string[] }) {
  return (
    <thead className='border-b border-border bg-surface-muted'>
      <tr>
        {cols.map((c) => (
          <th key={c} className='px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
            {c}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function Tr({ children }: { children: React.ReactNode }) {
  return <tr className='border-b border-border/50 last:border-0 transition-colors hover:bg-surface-muted/60'>{children}</tr>
}

function Td({ children, mono, muted, truncate }: {
  children: React.ReactNode
  mono?: boolean
  muted?: boolean
  truncate?: boolean
}) {
  return (
    <td className={[
      'px-4 py-3',
      mono ? 'font-mono text-xs' : 'text-sm',
      muted ? 'text-muted-foreground' : 'text-foreground',
      truncate ? 'max-w-xs truncate' : '',
    ].join(' ')}>
      {children}
    </td>
  )
}
