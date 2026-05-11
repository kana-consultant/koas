type Variant = 'green' | 'yellow' | 'red' | 'blue' | 'zinc'

const styles: Record<Variant, string> = {
  green: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
  red: 'bg-red-500/10 text-red-400 ring-red-500/20',
  blue: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  zinc: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20',
}

type Props = {
  children: React.ReactNode
  variant?: Variant
}

export function Badge({ children, variant = 'zinc' }: Props) {
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono ring-1 ring-inset ${styles[variant]}`}>
      {children}
    </span>
  )
}
