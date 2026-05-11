import { Link, Outlet, useParams, useRouterState } from '@tanstack/react-router'
import { useServer } from '@/apis/servers'

const tabs = [
  { label: 'services', path: 'services' },
  { label: 'ports', path: 'ports' },
  { label: 'resources', path: 'resources' },
] as const

export function ServerLayout() {
  const { serverId } = useParams({ from: '/servers/$serverId' })
  const { data, isLoading } = useServer(serverId)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const server = data?.data

  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="text-xs text-zinc-600 hover:text-zinc-400">
          ← servers
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <h1 className="text-lg font-medium text-zinc-100">
            {isLoading ? '...' : server?.name}
          </h1>
          {server && (
            <span className="text-xs text-zinc-500">
              {server.host}:{server.port}
            </span>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-zinc-800 pb-px">
        {tabs.map((tab) => {
          const to = `/servers/${serverId}/${tab.path}`
          const isActive = pathname === to
          return (
            <Link
              key={tab.path}
              to={`/servers/$serverId/${tab.path}`}
              params={{ serverId }}
              className={`px-3 py-2 text-xs font-mono transition-colors ${
                isActive
                  ? 'border-b border-zinc-400 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      <Outlet />
    </div>
  )
}
