import { useNavigate } from '@tanstack/react-router'
import { Button, Skeleton } from '@kana-consultant/ui-kit'
import { Server, Plus } from 'lucide-react'
import { useServers } from '@/apis/servers'

export function IndexPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useServers()
  const servers = data?.data ?? []

  if (isLoading) {
    return (
      <div className='space-y-3 p-2'>
        <Skeleton className='h-5 w-32' />
        <Skeleton className='h-4 w-48' />
      </div>
    )
  }

  if (servers.length === 0) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='flex flex-col items-center gap-5 text-center'>
          <div className='rounded-2xl border border-border bg-surface p-6'>
            <Server className='size-10 text-primary' />
          </div>
          <div>
            <p className='text-base font-semibold text-foreground'>No servers registered</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              Add a VPS running koas-agent to start monitoring
            </p>
          </div>
          <Button leadingIcon={<Plus />} onClick={() => navigate({ to: '/servers/new' })}>
            Add your first server
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-full items-center justify-center'>
      <div className='flex flex-col items-center gap-3 text-center'>
        <Server className='size-8 text-muted-foreground' />
        <p className='text-sm text-muted-foreground'>Select a server from the sidebar</p>
      </div>
    </div>
  )
}
