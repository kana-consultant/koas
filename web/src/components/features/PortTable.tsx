import { Badge } from '@/components/ui/Badge'
import type { PortInfo } from '@/apis/agent'

type Props = { data: PortInfo[] }

export function PortTable({ data }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
            <th className="pb-2 pr-4">Proto</th>
            <th className="pb-2 pr-4">Address</th>
            <th className="pb-2 pr-4">Port</th>
            <th className="pb-2 pr-4">State</th>
            <th className="pb-2">Process</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {data.map((p, i) => (
            <tr key={i} className="hover:bg-zinc-900/50">
              <td className="py-2 pr-4">
                <Badge variant="blue">{p.protocol.toUpperCase()}</Badge>
              </td>
              <td className="py-2 pr-4 text-zinc-400">{p.local_address}</td>
              <td className="py-2 pr-4 text-zinc-200">{p.local_port}</td>
              <td className="py-2 pr-4">
                <Badge variant={p.state === 'LISTEN' ? 'green' : 'zinc'}>{p.state}</Badge>
              </td>
              <td className="py-2 text-zinc-500">{p.process ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
