type Props = {
  active: boolean
  pulse?: boolean
}

export function StatusDot({ active, pulse = false }: Props) {
  return (
    <span className="relative flex h-2 w-2">
      {active && pulse && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      )}
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${active ? 'bg-emerald-400' : 'bg-zinc-600'}`}
      />
    </span>
  )
}
