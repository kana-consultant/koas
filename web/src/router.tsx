import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'
import { AppLayout } from './components/layout/AppLayout'
import { IndexPage } from './routes/index'
import { NewServerPage } from './routes/servers.new'
import { ServerLayout } from './routes/servers.$serverId'
import { ServicesPage } from './routes/servers.$serverId.services'
import { PortsPage } from './routes/servers.$serverId.ports'
import { ResourcesPage } from './routes/servers.$serverId.resources'

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
  component: ServerLayout,
})

const servicesRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: '/services',
  component: ServicesPage,
})

const portsRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: '/ports',
  component: PortsPage,
})

const resourcesRoute = createRoute({
  getParentRoute: () => serverRoute,
  path: '/resources',
  component: ResourcesPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  newServerRoute,
  serverRoute.addChildren([servicesRoute, portsRoute, resourcesRoute]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
