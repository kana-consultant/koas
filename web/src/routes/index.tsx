import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, Button, Skeleton } from '@kana-consultant/ui-kit'
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
        <Card className='w-full max-w-sm text-center'>
          <CardContent className='flex flex-col items-center gap-4 py-10'>
            <div className='rounded-full bg-primary/10 p-4'>
              <Server className='size-8 text-primary' />
            </div>
            <div>
              <p className='font-medium'>No servers yet</p>
              <p className='mt-1 text-sm text-muted-foreground'>
                Register your first VPS to start monitoring
              </p>
            </div>
            <Button leadingIcon={<Plus />} onClick={() => navigate({ to: '/servers/new' })}>
              Add server
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='flex h-full items-center justify-center'>
      <div className='text-center'>
        <Server className='mx-auto size-8 text-muted-foreground' />
        <p className='mt-3 text-sm text-muted-foreground'>
          Select a server from the sidebar
        </p>
      </div>
    </div>
  )
}
