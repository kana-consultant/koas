import { Outlet, useNavigate, useParams, useRouterState } from '@tanstack/react-router'
import { DashboardShell, Sidebar, TopBar, Button } from '@kana-consultant/ui-kit'
import { Server, Plus, Trash2 } from 'lucide-react'
import { useDeleteServer, useServers } from '@/apis/servers'

function KoasLogo() {
  return (
    <svg viewBox='0 0 24 24' fill='none' className='size-5 text-primary-foreground' stroke='currentColor' strokeWidth={1.8}>
      <rect x='2' y='3' width='20' height='5' rx='1.5' />
      <rect x='2' y='10' width='20' height='5' rx='1.5' />
      <rect x='2' y='17' width='20' height='5' rx='1.5' />
      <circle cx='19' cy='5.5' r='1' fill='currentColor' stroke='none' />
      <circle cx='19' cy='12.5' r='1' fill='currentColor' stroke='none' />
    </svg>
  )
}

export function AppLayout() {
  const navigate = useNavigate()
  const { data } = useServers()
  const { mutate: deleteServer } = useDeleteServer()

  const params = useParams({ strict: false }) as { serverId?: string }
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const servers = data?.data ?? []
  const activeId = params.serverId ?? (pathname === '/servers/new' ? '__new' : '')
  const activeServer = servers.find((s) => s.id === activeId)

  const navItems = servers.map((s) => ({
    id: s.id,
    label: s.name,
    icon: Server,
  }))

  const secondaryItems = [{ id: '__new', label: 'Add server', icon: Plus }]

  const handleNavigate = (id: string) => {
    if (id === '__new') {
      navigate({ to: '/servers/new' })
    } else {
      navigate({ to: '/servers/$serverId', params: { serverId: id } })
    }
  }

  const topBarActions = activeServer ? (
    <Button
      variant='destructive'
      size='sm'
      leadingIcon={<Trash2 />}
      onClick={() => {
        deleteServer(activeServer.id, {
          onSuccess: () => navigate({ to: '/' }),
        })
      }}
    >
      Remove
    </Button>
  ) : undefined

  return (
    <DashboardShell
      sidebar={
        <Sidebar
          logo={<KoasLogo />}
          brandName='koas'
          items={navItems}
          secondaryItems={secondaryItems}
          activeId={activeId}
          onNavigate={handleNavigate}
        />
      }
      topBar={
        <TopBar
          title={pathname === '/servers/new' ? 'Add server' : (activeServer?.name ?? 'koas')}
          subtitle={activeServer ? `${activeServer.host}:${activeServer.port}` : 'VPS Orchestrator'}
          actions={topBarActions}
        />
      }
    >
      <Outlet />
    </DashboardShell>
  )
}
