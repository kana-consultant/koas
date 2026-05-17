import { useState } from 'react'
import { Search, Download, Trash2, ArrowUpCircle, Loader2 } from 'lucide-react'
import { usePackages, usePackageSearch, useInstallPackage, useRemovePackage, useUpgradePackages } from './packages/_apis'

export function PackagesPage() {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'installed' | 'search'>('installed')

  const { data: pkgData, isLoading: loadingInstalled, refetch } = usePackages()
  const { data: searchResults, isLoading: searching } = usePackageSearch(tab === 'search' ? search : '')
  const { mutate: install, isPending: installing } = useInstallPackage()
  const { mutate: remove, isPending: removing } = useRemovePackage()
  const { mutate: upgrade, isPending: upgrading } = useUpgradePackages()

  const installed: any[] = (pkgData as any)?.packages ?? []
  const manager: string = (pkgData as any)?.manager ?? ''

  const filtered = tab === 'installed'
    ? installed.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : (searchResults as any[]) ?? []

  return (
    <div className='space-y-4'>
      {/* Header row */}
      <div className='flex flex-wrap items-center gap-3'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2' style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder={tab === 'installed' ? 'Filter installed…' : 'Search packages…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none'
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>

        {(['installed', 'search'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className='rounded-lg px-3 py-2 text-sm font-medium transition-colors'
            style={{
              background: tab === t ? 'var(--accent-soft)' : 'var(--bg-surface)',
              color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            {t === 'installed' ? 'Installed' : 'Search'}
          </button>
        ))}

        {tab === 'installed' && (
          <button
            disabled={upgrading}
            onClick={() => upgrade(undefined, { onSuccess: () => refetch() })}
            className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60'
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--border)' }}
          >
            {upgrading ? <Loader2 className='size-4 animate-spin' /> : <ArrowUpCircle className='size-4' />}
            Upgrade all
          </button>
        )}
      </div>

      {/* Manager badge */}
      {manager && (
        <p className='text-xs' style={{ color: 'var(--text-muted)' }}>
          Package manager: <span className='font-mono font-semibold' style={{ color: 'var(--accent)' }}>{manager}</span>
          {tab === 'installed' && ` · ${installed.length} installed`}
        </p>
      )}

      {/* Table */}
      <div className='overflow-x-auto rounded-xl' style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <table className='w-full text-sm'>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
              {['Package', 'Version', 'Description', 'Action'].map((h) => (
                <th key={h} className='px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest' style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loadingInstalled || (tab === 'search' && searching) ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {[1, 2, 3, 4].map((j) => (
                    <td key={j} className='px-4 py-3'>
                      <div className='h-4 animate-pulse rounded' style={{ background: 'var(--bg-elevated)', width: j === 3 ? '80%' : '50%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className='px-4 py-12 text-center' style={{ color: 'var(--text-muted)' }}>
                  {tab === 'search' && search.length < 2 ? 'Type at least 2 characters to search' : 'No packages found'}
                </td>
              </tr>
            ) : (
              filtered.map((pkg: any) => (
                <tr key={pkg.name} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className='px-4 py-3 font-mono text-xs font-medium' style={{ color: 'var(--text)' }}>{pkg.name}</td>
                  <td className='px-4 py-3 font-mono text-xs' style={{ color: 'var(--text-muted)' }}>{pkg.version || '—'}</td>
                  <td className='px-4 py-3 text-xs max-w-xs truncate' style={{ color: 'var(--text-muted)' }}>{pkg.description || '—'}</td>
                  <td className='px-4 py-3'>
                    {pkg.installed ? (
                      <button
                        disabled={removing}
                        onClick={() => remove(pkg.name, { onSuccess: () => refetch() })}
                        className='flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60'
                        style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
                      >
                        {removing ? <Loader2 className='size-3 animate-spin' /> : <Trash2 className='size-3' />}
                        Remove
                      </button>
                    ) : (
                      <button
                        disabled={installing}
                        onClick={() => install(pkg.name, { onSuccess: () => refetch() })}
                        className='flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60'
                        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                      >
                        {installing ? <Loader2 className='size-3 animate-spin' /> : <Download className='size-3' />}
                        Install
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
