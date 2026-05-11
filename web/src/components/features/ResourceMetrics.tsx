import type { Resources } from '@/apis/agent'

function formatBytes(bytes: number): string {
  const gb = bytes / 1024 / 1024 / 1024
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  const mb = bytes / 1024 / 1024
  return `${mb.toFixed(0)} MB`
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function Gauge({ label, value, detail }: { label: string; value: number; detail: string }) {
  const pct = Math.min(100, Math.max(0, value))
  const color = pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-emerald-500'
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300">{detail}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-800">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-right text-xs font-mono text-zinc-500">{pct.toFixed(1)}%</div>
    </div>
  )
}

type Props = { data: Resources }

export function ResourceMetrics({ data }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-3 text-xs font-mono uppercase tracking-wider text-zinc-500">CPU</div>
          <Gauge label="Usage" value={data.cpu_usage} detail={`${data.cpu_usage.toFixed(1)}%`} />
          <div className="mt-3 flex gap-3 text-xs font-mono text-zinc-500">
            <span>1m: {data.load_avg_1.toFixed(2)}</span>
            <span>5m: {data.load_avg_5.toFixed(2)}</span>
            <span>15m: {data.load_avg_15.toFixed(2)}</span>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-3 text-xs font-mono uppercase tracking-wider text-zinc-500">Memory</div>
          <Gauge
            label="RAM"
            value={data.memory_percent}
            detail={`${formatBytes(data.memory_used)} / ${formatBytes(data.memory_total)}`}
          />
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-3 text-xs font-mono uppercase tracking-wider text-zinc-500">Disk</div>
          <Gauge
            label="Storage"
            value={data.disk_percent}
            detail={`${formatBytes(data.disk_used)} / ${formatBytes(data.disk_total)}`}
          />
          <div className="mt-3 text-xs font-mono text-zinc-500">
            Uptime: {formatUptime(data.uptime_seconds)}
          </div>
        </div>
      </div>
    </div>
  )
}
