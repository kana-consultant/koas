import { Search } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  shortcut?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder = 'Search…', shortcut, className = '' }: SearchInputProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className='absolute left-3.5 size-4 shrink-0' style={{ color: 'var(--text-muted)' }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-colors'
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      />
      {shortcut && (
        <kbd
          className='absolute right-3 rounded-md px-1.5 py-0.5 text-[11px] font-mono'
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          {shortcut}
        </kbd>
      )}
    </div>
  )
}
