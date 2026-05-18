import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, Server, Package, Activity, LogOut,
  Menu, X, Settings, HelpCircle, Bell, Mail, Cpu,
} from 'lucide-react'
import { clearToken } from '@/libs/auth'
import { useSystemInfo } from '@/routes/dashboard/_apis'
import { SearchInput } from '@/components/ui'

const NAV_MAIN = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/services',  label: 'Services',  icon: Activity },
  { path: '/packages',  label: 'Packages',  icon: Package },
  { path: '/machines',  label: 'Machines',  icon: Server },
]

const NAV_GENERAL = [
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/help',     label: 'Help',     icon: HelpCircle },
]

export function AppLayout() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { data: sysInfo } = useSystemInfo()

  function isActive(path: string) {
    return pathname === path || (path !== '/dashboard' && pathname.startsWith(path))
  }

  function NavItem({ path, label, icon: Icon, badge }: { path: string; label: string; icon: React.ElementType; badge?: number }) {
    const active = isActive(path)
    return (
      <button
        onClick={() => { navigate({ to: path }); setSidebarOpen(false) }}
        className='nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all mb-0.5 relative cursor-pointer'
        style={{
          background: active ? 'var(--accent-soft)' : 'transparent',
          color: active ? 'var(--accent)' : 'var(--text-muted)',
        }}
      >
        {active && (
          <span
            className='absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full'
            style={{ background: 'var(--accent)' }}
          />
        )}
        <Icon className='size-4 shrink-0' />
        <span>{label}</span>
        {badge != null && (
          <span
            className='ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold'
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>
    )
  }

  const currentLabel = [...NAV_MAIN, ...NAV_GENERAL]
    .find((n) => isActive(n.path))?.label ?? 'koas'

  return (
    <div className='flex h-screen gap-6 p-6 overflow-hidden' style={{ background: 'var(--bg)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className='fixed inset-0 z-20 bg-black/30 lg:hidden' onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — floating island */}
      <aside
        className={[
          'fixed inset-y-6 left-6 z-30 flex w-56 flex-col transition-transform duration-200 lg:static lg:inset-auto lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+24px)]',
        ].join(' ')}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-island)',
          boxShadow: 'var(--shadow-island)',
        }}
      >
        {/* Logo */}
        <div className='flex shrink-0 items-center gap-3 px-5 pt-5 pb-4'>
          <div
            className='flex h-9 w-9 items-center justify-center rounded-xl shrink-0'
            style={{ background: 'var(--accent)' }}
          >
            <Cpu className='size-4.5' style={{ color: '#fff' }} />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-base font-bold tracking-tight leading-none' style={{ color: 'var(--text)' }}>koas</p>
            <p className='text-[10px] mt-0.5 font-medium' style={{ color: 'var(--text-muted)' }}>Server Management</p>
          </div>
          <button className='lg:hidden shrink-0' onClick={() => setSidebarOpen(false)}>
            <X className='size-4' style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
        <div className='mx-5 mb-1' style={{ height: '1px', background: 'var(--border)' }} />

        {/* Nav */}
        <nav className='flex-1 overflow-y-auto px-3 py-4 space-y-5'>
          <div>
            <p className='mb-2 px-3 text-[10px] font-bold uppercase tracking-widest' style={{ color: 'var(--text-muted)' }}>Menu</p>
            {NAV_MAIN.map((item) => <NavItem key={item.path} {...item} />)}
          </div>
          <div>
            <p className='mb-2 px-3 text-[10px] font-bold uppercase tracking-widest' style={{ color: 'var(--text-muted)' }}>General</p>
            {NAV_GENERAL.map((item) => <NavItem key={item.path} {...item} />)}
            <button
              onClick={() => { clearToken(); navigate({ to: '/login' }) }}
              className='nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all mb-0.5 cursor-pointer'
              style={{ color: 'var(--text-muted)' }}
            >
              <LogOut className='size-4 shrink-0' />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        {/* System info pill */}
        {sysInfo && (
          <div className='mx-3 mb-4 p-4' style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-island)' }}>
            <div className='flex items-center gap-2 mb-2'>
              <Server className='size-3.5 opacity-70' />
              <span className='text-[11px] font-semibold opacity-70 uppercase tracking-wider'>Local System</span>
            </div>
            <p className='font-bold text-sm'>{sysInfo.hostname}</p>
            <p className='text-[11px] opacity-60 mt-0.5'>{sysInfo.os_name} · {sysInfo.arch}</p>
          </div>
        )}
      </aside>

      {/* Right column */}
      <div className='flex flex-1 flex-col gap-3 overflow-hidden min-w-0'>
        {/* Topbar — floating island */}
        <header
          className='flex h-16 shrink-0 items-center gap-4 px-5'
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-island)',
            boxShadow: 'var(--shadow-island)',
          }}
        >
          <button className='lg:hidden shrink-0' onClick={() => setSidebarOpen(true)}>
            <Menu className='size-5' style={{ color: 'var(--text-muted)' }} />
          </button>

          <h1 className='text-lg font-bold tracking-tight hidden lg:block' style={{ color: 'var(--text)' }}>
            {currentLabel}
          </h1>

          <div className='ml-auto flex items-center gap-2'>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder='Search…'
              shortcut='⌘F'
              className='max-w-xs'
            />
            {[Mail, Bell].map((Icon, i) => (
              <button
                key={i}
                className='flex h-9 w-9 items-center justify-center rounded-xl transition-colors'
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                <Icon className='size-4' />
              </button>
            ))}

            {sysInfo && (
              <div className='ml-1 flex items-center gap-2.5'>
                <div
                  className='flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm'
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  {(sysInfo.hostname?.[0] ?? 'K').toUpperCase()}
                </div>
                <div className='hidden sm:block'>
                  <p className='text-sm font-semibold leading-none' style={{ color: 'var(--text)' }}>{sysInfo.hostname}</p>
                  <p className='text-[11px] mt-0.5' style={{ color: 'var(--text-muted)' }}>{sysInfo.os_family}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className='flex-1 overflow-y-auto'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
