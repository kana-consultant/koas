const COLORS = [
  '#1b5e35', '#2e7d52', '#4caf77', '#388e3c',
  '#1565c0', '#7b1fa2', '#c62828', '#e65100',
]

function colorForName(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

interface AvatarProps {
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-11 w-11 text-sm' }

export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
  const bg = colorForName(name)

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0 ${className}`}
      style={{ background: bg }}
    >
      {initials}
    </div>
  )
}
