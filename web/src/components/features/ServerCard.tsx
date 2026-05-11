import { Link } from '@tanstack/react-router'
import { StatusDot } from '@/components/ui/StatusDot'
import type { Server } from '@/apis/servers'

type Props = {
  server: Server
  onDelete: (id: string) => void
}

export function ServerCard({ server, onDelete }: Props) {
  return (
    <div className="group relative rounded-lg border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <StatusDot active pulse />
          <div>
            <Link
              to="/servers/$serverId/services"
              params={{ serverId: server.id }}
              className="font-mono text-sm font-medium text-zinc-100 hover:text-white"
            >
              {server.name}
            </Link>
            <p className="mt-0.5 font-mono text-xs text-zinc-500">
              {server.host}:{server.port}
            </p>
          </div>
        </div>
        <button
          onClick={() => onDelete(server.id)}
          className="text-xs text-zinc-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
        >
          remove
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          to="/servers/$serverId/services"
          params={{ serverId: server.id }}
          className="rounded border border-zinc-800 px-2 py-1 text-xs font-mono text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
        >
          services
        </Link>
        <Link
          to="/servers/$serverId/ports"
          params={{ serverId: server.id }}
          className="rounded border border-zinc-800 px-2 py-1 text-xs font-mono text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
        >
          ports
        </Link>
        <Link
          to="/servers/$serverId/resources"
          params={{ serverId: server.id }}
          className="rounded border border-zinc-800 px-2 py-1 text-xs font-mono text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
        >
          resources
        </Link>
      </div>
    </div>
  )
}
