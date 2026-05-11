import { Link, Outlet, useRouterState } from '@tanstack/react-router'

export function AppLayout() {
  const isLoading = useRouterState({ select: (s) => s.isLoading })

  return (
    <div className="min-h-screen bg-zinc-950 font-mono text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="text-sm font-medium tracking-widest text-zinc-100 hover:text-white">
            koas
          </Link>
          <div className="flex items-center gap-1">
            {isLoading && (
              <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
            )}
            <span className="text-xs text-zinc-600">v0.1.0</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
