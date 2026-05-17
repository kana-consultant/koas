import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
}

const styles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--accent)',
    color: 'var(--text-inverse)',
    border: 'none',
  },
  outline: {
    background: 'transparent',
    color: 'var(--text)',
    border: '1.5px solid var(--border-strong)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: 'none',
  },
  danger: {
    background: 'var(--danger-soft)',
    color: 'var(--danger)',
    border: '1px solid var(--danger-soft)',
  },
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2 text-sm gap-2 rounded-xl',
  lg: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className = '', style, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-opacity disabled:opacity-60 ${sizes[size]} ${className}`}
      style={{ ...styles[variant], ...style }}
      {...props}
    >
      {loading ? <Loader2 className='size-4 animate-spin' /> : icon}
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
