import { Link } from '@tanstack/react-router'
import { ServerCard } from '@/components/features/ServerCard'
import { useDeleteServer, useServers } from '@/apis/servers'

export function IndexPage() {
  const { data, isLoading, error } = useServers()
  const { mutate: deleteServer } = useDeleteServer()

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-zinc-600">
        loading servers...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400">
        Failed to load servers
      </div>
    )
  }

  const servers = data?.data ?? []

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-zinc-100">Servers</h1>
          <p className="mt-0.5 text-xs text-zinc-500">{servers.length} registered</p>
        </div>
        <Link
          to="/servers/new"
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-mono text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
        >
          + add server
        </Link>
      </div>

      {servers.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-800 text-zinc-600">
          <span className="text-sm">No servers registered</span>
          <Link to="/servers/new" className="text-xs text-zinc-500 hover:text-zinc-300">
            Add your first server →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <ServerCard key={server.id} server={server} onDelete={deleteServer} />
          ))}
        </div>
      )}
    </div>
  )
}
