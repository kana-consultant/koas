import { Video } from 'lucide-react'
import { useSystemInfo, useSystemServices, useMachines, usePackages } from './dashboard/_apis'
import { StatCard, Card, CardHeader, BarChart, ProgressGauge, TimeTracker, Badge, Button } from '@/components/ui'

function uptime(secs: number) {
  const d = Math.floor(secs / 86400)
  const h = Math.floor((secs % 86400) / 3600)
  if (d > 0) return `${d}d ${h}h`
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const WEEK_BARS = [
  { label: 'S', value: 55 },
  { label: 'M', value: 70 },
  { label: 'T', value: 74, highlighted: true },
  { label: 'W', value: 90 },
  { label: 'T', value: 40 },
  { label: 'F', value: 30 },
  { label: 'S', value: 20 },
]

export function DashboardPage() {
  const { data: sys } = useSystemInfo()
  const { data: servicesPage } = useSystemServices()
  const { data: machinesPage } = useMachines()
  const { data: pkgData } = usePackages()

  const allServices = servicesPage?.items ?? []
  const activeServices = allServices.filter((s) => s.active_state === 'active').length
  const failedServices = allServices.filter((s) => s.active_state === 'failed').length
  const totalServices = servicesPage?.total ?? allServices.length
  const uptimePct = totalServices > 0 ? Math.round((activeServices / totalServices) * 100) : 0
  const machines = machinesPage?.items ?? []
  const totalMachines = machinesPage?.total ?? machines.length

  return (
    <div className='space-y-5'>
      {/* Stat row */}
      <div className='grid gap-4 grid-cols-2 lg:grid-cols-4'>
        <StatCard
          label='Total Services'
          value={servicesPage ? String(totalServices) : '—'}
          trend='Increased from last boot'
          dark
        />
        <StatCard
          label='Active Services'
          value={servicesPage ? String(activeServices) : '—'}
          trend='Increased from last month'
        />
        <StatCard
          label='Packages'
          value={pkgData ? String(pkgData.total) : '—'}
          trend={`via ${pkgData?.manager ?? 'manager'}`}
        />
        <StatCard
          label='Machines'
          value={machinesPage ? String(totalMachines) : '—'}
          trend='registered via SSH'
        />
      </div>

      {/* Middle row */}
      <div className='grid gap-4 lg:grid-cols-3'>
        {/* Activity chart */}
        <Card className='lg:col-span-1'>
          <CardHeader title='Service Activity' subtitle='This week' />
          <BarChart bars={WEEK_BARS} />
        </Card>

        {/* System reminder card */}
        <Card className='lg:col-span-1'>
          <CardHeader title='System Status' />
          {sys ? (
            <div className='space-y-3'>
              <div>
                <p className='text-2xl font-bold' style={{ color: 'var(--text)' }}>{sys.hostname}</p>
                <p className='text-sm mt-1' style={{ color: 'var(--text-muted)' }}>
                  {sys.os_name} {sys.os_version}
                </p>
              </div>
              <div className='grid grid-cols-2 gap-2 text-xs'>
                {[
                  ['Kernel', sys.kernel],
                  ['Arch', sys.arch],
                  ['Uptime', uptime(sys.uptime_seconds)],
                  ['OS Family', sys.os_family],
                ].map(([k, v]) => (
                  <div key={k} className='rounded-2xl p-2.5' style={{ background: 'var(--bg-elevated)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>{k}</p>
                    <p className='font-semibold mt-0.5' style={{ color: 'var(--text)' }}>{v}</p>
                  </div>
                ))}
              </div>
              <Button
                variant='primary'
                size='md'
                className='w-full mt-2'
                icon={<Video className='size-4' />}
              >
                View Details
              </Button>
            </div>
          ) : (
            <div className='space-y-2'>
              {[1,2,3].map((i) => <div key={i} className='h-8 animate-pulse rounded-2xl' style={{ background: 'var(--bg-elevated)' }} />)}
            </div>
          )}
        </Card>

        {/* Failed services / health */}
        <Card className='lg:col-span-1'>
          <CardHeader title='Failed Services' />
          {failedServices > 0 ? (
            <div className='space-y-2'>
              {allServices
                .filter((s) => s.active_state === 'failed')
                .slice(0, 5)
                .map((s) => (
                  <div key={s.name} className='flex items-center justify-between rounded-2xl px-3 py-2.5' style={{ background: 'var(--bg-elevated)' }}>
                    <span className='font-mono text-xs font-medium' style={{ color: 'var(--text)' }}>{s.name}</span>
                    <Badge status='failed' label={s.sub_state} />
                  </div>
                ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-8' style={{ color: 'var(--text-muted)' }}>
              <span className='text-3xl'>✓</span>
              <p className='mt-2 text-sm font-medium' style={{ color: 'var(--success)' }}>All services healthy</p>
            </div>
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className='grid gap-4 lg:grid-cols-3'>
        {/* Machines list */}
        <Card className='lg:col-span-2'>
          <CardHeader title='Machines' action={
            <Button variant='outline' size='sm'>+ Add Machine</Button>
          } />
          {machines.length > 0 ? (
            <div className='space-y-2'>
              {machines.slice(0, 5).map((m) => (
                <div key={m.id} className='flex items-center gap-3 rounded-2xl px-3 py-2.5' style={{ background: 'var(--bg-elevated)' }}>
                  <div className='h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold' style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    {(m.name?.[0] ?? 'M').toUpperCase()}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold truncate' style={{ color: 'var(--text)' }}>{m.name}</p>
                    <p className='text-xs font-mono truncate' style={{ color: 'var(--text-muted)' }}>{m.host}:{m.port ?? 22}</p>
                  </div>
                  <Badge status={m.status ?? 'unknown'} />
                </div>
              ))}
            </div>
          ) : (
            <p className='py-8 text-center text-sm' style={{ color: 'var(--text-muted)' }}>No machines registered</p>
          )}
        </Card>

        {/* Right column: gauge + timer */}
        <div className='space-y-4'>
          <Card>
            <CardHeader title='Service Health' />
            <ProgressGauge value={uptimePct} label='Active' size={140} />
            <div className='mt-4 flex justify-center gap-4 text-xs'>
              {[
                { label: 'Active', color: 'var(--accent)' },
                { label: 'Failed', color: 'var(--danger)' },
                { label: 'Inactive', color: 'var(--border-strong)' },
              ].map(({ label, color }) => (
                <span key={label} className='flex items-center gap-1.5'>
                  <span className='h-2 w-2 rounded-full shrink-0' style={{ background: color }} />
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                </span>
              ))}
            </div>
          </Card>
          <TimeTracker />
        </div>
      </div>
    </div>
  )
}
