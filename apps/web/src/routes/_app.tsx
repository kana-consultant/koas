import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAuthenticated } from '@/libs/auth/index.ts'
import { AppLayout } from '@/components/layout/app-layout.tsx'

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: '/login' })
  },
  component: AppLayout,
})
