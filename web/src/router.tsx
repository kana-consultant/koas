import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'
import { AppLayout } from './components/layout/AppLayout'
import { IndexPage } from './routes/index'
import { NewServerPage } from './routes/servers.new'
import { ServerPage } from './routes/servers.$serverId'

const rootRoute = createRootRoute({ component: AppLayout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
})

const newServerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/servers/new',
  component: NewServerPage,
})

const serverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/servers/$serverId',
  component: ServerPage,
})

const routeTree = rootRoute.addChildren([indexRoute, newServerRoute, serverRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
