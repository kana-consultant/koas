import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Input, Label, Button,
} from '@kana-consultant/ui-kit'
import { useCreateServer } from '@/apis/servers'

export function NewServerPage() {
  const navigate = useNavigate()
  const { mutate: createServer, isPending, error } = useCreateServer()

  const [form, setForm] = useState({ name: '', host: '', port: 9000, token: '' })

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createServer(form, { onSuccess: () => navigate({ to: '/' }) })
  }

  return (
    <div className='mx-auto max-w-md'>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Register server</CardTitle>
            <CardDescription>
              Add a VPS running koas-agent to start monitoring it.
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='name' required>Name</Label>
              <Input id='name' placeholder='prod-01' value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='host' required>Host</Label>
              <Input id='host' placeholder='203.0.113.10' value={form.host} onChange={(e) => set('host', e.target.value)} required />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='port' required>Agent port</Label>
              <Input id='port' type='number' placeholder='9000' value={form.port} onChange={(e) => set('port', Number(e.target.value))} required />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='token' required>Agent token</Label>
              <Input id='token' type='password' placeholder='••••••••' value={form.token} onChange={(e) => set('token', e.target.value)} required invalid={!!error} />
              {error && (
                <p className='text-sm text-danger'>
                  {(error as Error).message ?? 'Failed to register server'}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className='justify-end'>
            <Button variant='ghost' type='button' onClick={() => navigate({ to: '/' })}>
              Cancel
            </Button>
            <Button type='submit' loading={isPending}>
              Register
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
