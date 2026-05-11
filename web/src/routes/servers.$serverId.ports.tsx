import { useParams } from '@tanstack/react-router'
import { usePorts } from '@/apis/agent'
import { PortTable } from '@/components/features/PortTable'

export function PortsPage() {
  const { serverId } = useParams({ from: '/servers/$serverId/ports' })
  const { data, isLoading, error } = usePorts(serverId)

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      {isLoading && (
        <div className="py-8 text-center text-xs text-zinc-600">loading...</div>
      )}
      {error && (
        <div className="py-4 text-center text-xs text-red-400">
          Agent unreachable or ports unavailable
        </div>
      )}
      {data && data.length === 0 && (
        <div className="py-8 text-center text-xs text-zinc-600">No open ports found</div>
      )}
      {data && data.length > 0 && <PortTable data={data} />}
    </div>
  )
}
