import { useParams } from '@tanstack/react-router'
import { useResources } from '@/apis/agent'
import { ResourceMetrics } from '@/components/features/ResourceMetrics'

export function ResourcesPage() {
  const { serverId } = useParams({ from: '/servers/$serverId/resources' })
  const { data, isLoading, error } = useResources(serverId)

  return (
    <div>
      {isLoading && (
        <div className="flex h-40 items-center justify-center text-xs text-zinc-600">
          loading...
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400">
          Agent unreachable or resources unavailable
        </div>
      )}
      {data && <ResourceMetrics data={data} />}
    </div>
  )
}
