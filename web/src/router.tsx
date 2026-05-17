import { createRouter, createRoute, createRootRoute, redirect } from '@tanstack/react-router'
import { isAuthenticated } from '@/stores/auth'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/routes/login'
import { DashboardPage } from '@/routes/dashboard'
import { ServicesPage } from '@/routes/services'
import { ServiceDetailPage } from '@/routes/services.$name'
import { PackagesPage } from '@/routes/packages'
import { MachinesPage } from '@/routes/machines'
import { AddMachinePage } from '@/routes/machines.new'

const rootRoute = createRootRoute()

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: () => {
    if (isAuthenticated()) throw redirect({ to: '/dashboard' })
  },
})

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AppLayout,
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: '/login' })
  },
})

const indexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/dashboard' }) },
})

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/dashboard',
  component: DashboardPage,
})

const servicesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/services',
  component: ServicesPage,
})

const serviceDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/services/$name',
  component: ServiceDetailPage,
})

const packagesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/packages',
  component: PackagesPage,
})

const machinesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/machines',
  component: MachinesPage,
})

const addMachineRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/machines/new',
  component: AddMachinePage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  appRoute.addChildren([
    indexRoute,
    dashboardRoute,
    servicesRoute,
    serviceDetailRoute,
    packagesRoute,
    machinesRoute,
    addMachineRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
