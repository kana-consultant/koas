import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { Tabs, TabsList, TabsTrigger, TabsContent, Badge, Progress, StatCard, Skeleton } from '@kana-consultant/ui-kit'
import { Cpu, HardDrive, Database, Clock } from 'lucide-react'
import {
  useSystemdServices, useDockerContainers, useProcesses, useNginxSites,
  usePorts, useResources,
} from '@/apis/agent'
import type { SystemdService, DockerContainer, ProcessInfo, NginxSite, PortInfo } from '@/apis/agent'

export function ServerPage() {
  const { serverId } = useParams({ from: '/servers/$serverId' })
  const [tab, setTab] = useState('services')

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value='services'>Services</TabsTrigger>
        <TabsTrigger value='ports'>Ports</TabsTrigger>
        <TabsTrigger value='resources'>Resources</TabsTrigger>
      </TabsList>
      <TabsContent value='services'><ServicesSection serverId={serverId} /></TabsContent>
      <TabsContent value='ports'><PortsSection serverId={serverId} /></TabsContent>
      <TabsContent value='resources'><ResourcesSection serverId={serverId} /></TabsContent>
    </Tabs>
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
    <div className='space-y-4'>
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
    </div>
  )
}

function PortsSection({ serverId }: { serverId: string }) {
  const { data, isLoading } = usePorts(serverId)
  if (isLoading) return <TableSkeleton />
  return <PortTable data={data ?? []} />
}

function ResourcesSection({ serverId }: { serverId: string }) {
  const { data, isLoading } = useResources(serverId)

  if (isLoading) {
    return (
      <div className='grid gap-4 sm:grid-cols-3'>
        {[0, 1, 2].map((i) => <Skeleton key={i} className='h-32 rounded-xl' />)}
      </div>
    )
  }

  if (!data) return null

  const fmt = (b: number) => {
    const gb = b / 1024 / 1024 / 1024
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(b / 1024 / 1024).toFixed(0)} MB`
  }

  const uptime = (() => {
    const d = Math.floor(data.uptime_seconds / 86400)
    const h = Math.floor((data.uptime_seconds % 86400) / 3600)
    return d > 0 ? `${d}d ${h}h` : `${h}h`
  })()

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          id='cpu' label='CPU usage' icon={Cpu} tone='primary'
          value={`${data.cpu_usage.toFixed(1)}%`}
          hint={`Load ${data.load_avg_1.toFixed(2)} · ${data.load_avg_5.toFixed(2)} · ${data.load_avg_15.toFixed(2)}`}
        />
        <StatCard
          id='mem' label='Memory' icon={Database} tone='info'
          value={fmt(data.memory_used)}
          hint={`of ${fmt(data.memory_total)}`}
        />
        <StatCard
          id='disk' label='Disk' icon={HardDrive} tone='warning'
          value={`${data.disk_percent.toFixed(1)}%`}
          hint={`${fmt(data.disk_used)} / ${fmt(data.disk_total)}`}
        />
        <StatCard
          id='uptime' label='Uptime' icon={Clock} tone='neutral'
          value={uptime}
          hint='System uptime'
        />
      </div>

      <div className='space-y-3'>
        <div className='flex items-center gap-3'>
          <span className='w-16 text-xs text-muted-foreground'>CPU</span>
          <Progress value={data.cpu_usage} tone='primary' className='flex-1' />
          <span className='w-12 text-right text-xs tabular-nums'>{data.cpu_usage.toFixed(1)}%</span>
        </div>
        <div className='flex items-center gap-3'>
          <span className='w-16 text-xs text-muted-foreground'>Memory</span>
          <Progress value={data.memory_percent} tone='info' className='flex-1' />
          <span className='w-12 text-right text-xs tabular-nums'>{data.memory_percent.toFixed(1)}%</span>
        </div>
        <div className='flex items-center gap-3'>
          <span className='w-16 text-xs text-muted-foreground'>Disk</span>
          <Progress value={data.disk_percent} tone='warning' className='flex-1' />
          <span className='w-12 text-right text-xs tabular-nums'>{data.disk_percent.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className='space-y-2 pt-2'>
      {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className='h-9 w-full rounded' />)}
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
            <Td><Badge tone={s.load === 'loaded' ? 'success' : 'neutral'} size='sm'>{s.load}</Badge></Td>
            <Td><Badge tone={s.active === 'active' ? 'success' : s.active === 'failed' ? 'danger' : 'warning'} dot size='sm'>{s.active}</Badge></Td>
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
            <Td><Badge tone={c.status.startsWith('Up') ? 'success' : 'danger'} size='sm'>{c.status}</Badge></Td>
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
      <Thead cols={['PID', 'Name', 'CPU%', 'MEM', 'Status']} />
      <tbody>
        {data.map((p) => (
          <Tr key={p.pid}>
            <Td mono muted>{p.pid}</Td>
            <Td mono>{p.name}</Td>
            <Td><Badge tone={p.cpu_usage > 10 ? 'warning' : 'neutral'} size='sm'>{p.cpu_usage.toFixed(1)}%</Badge></Td>
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
            <Td><Badge tone={s.enabled ? 'success' : 'neutral'} size='sm'>{s.enabled ? 'enabled' : 'disabled'}</Badge></Td>
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
            <Td><Badge tone='info' size='sm'>{p.protocol.toUpperCase()}</Badge></Td>
            <Td mono muted>{p.local_address}</Td>
            <Td mono>{p.local_port}</Td>
            <Td><Badge tone={p.state === 'LISTEN' ? 'success' : 'neutral'} size='sm'>{p.state}</Badge></Td>
            <Td muted>{p.process ?? '—'}</Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  )
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className='overflow-x-auto rounded-lg border border-border'>
      <table className='w-full text-sm'>{children}</table>
    </div>
  )
}

function Thead({ cols }: { cols: string[] }) {
  return (
    <thead className='border-b border-border bg-muted/30'>
      <tr>
        {cols.map((c) => (
          <th key={c} className='px-3 py-2 text-left text-xs font-medium text-muted-foreground'>
            {c}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function Tr({ children }: { children: React.ReactNode }) {
  return <tr className='border-b border-border/50 last:border-0 hover:bg-muted/20'>{children}</tr>
}

function Td({ children, mono, muted, truncate }: {
  children: React.ReactNode
  mono?: boolean
  muted?: boolean
  truncate?: boolean
}) {
  return (
    <td className={[
      'px-3 py-2',
      mono ? 'font-mono text-xs' : '',
      muted ? 'text-muted-foreground' : '',
      truncate ? 'max-w-xs truncate' : '',
    ].join(' ')}>
      {children}
    </td>
  )
}
