interface CardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  dark?: boolean
}

export function Card({ children, className = '', style, dark }: CardProps) {
  return (
    <div
      className={`p-5 ${className}`}
      style={{
        background: dark ? 'var(--accent)' : 'var(--bg-surface)',
        borderRadius: 'var(--radius-island)',
        boxShadow: 'var(--shadow-island)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  action?: React.ReactNode
  subtitle?: string
  dark?: boolean
}

export function CardHeader({ title, action, subtitle, dark }: CardHeaderProps) {
  return (
    <div className='mb-4 flex items-center justify-between gap-3'>
      <div>
        <h3 className='font-semibold text-sm' style={{ color: dark ? 'var(--text-inverse)' : 'var(--text)' }}>{title}</h3>
        {subtitle && <p className='text-xs mt-0.5' style={{ color: dark ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
