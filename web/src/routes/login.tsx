import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Cpu, Eye, EyeOff } from 'lucide-react'
import { useLogin } from './login/_apis'
import { setToken } from '@/libs/auth'
import { Button } from '@/components/ui'

export function LoginPage() {
  const navigate = useNavigate()
  const { mutate: login, isPending, error } = useLogin()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    login(form, {
      onSuccess: (data) => {
        setToken(data.token)
        navigate({ to: '/dashboard' })
      },
    })
  }

  return (
    <div
      className='flex min-h-screen items-center justify-center px-4'
      style={{ background: 'var(--bg)' }}
    >
      <div className='w-full max-w-sm'>
        {/* Logo */}
        <div className='mb-8 text-center'>
          <div
            className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl'
            style={{ background: 'var(--accent)' }}
          >
            <Cpu className='size-8 text-white' />
          </div>
          <h1 className='text-2xl font-bold tracking-tight' style={{ color: 'var(--text)' }}>koas</h1>
          <p className='mt-1 text-sm' style={{ color: 'var(--text-muted)' }}>Sign in to manage your servers</p>
        </div>

        {/* Card */}
        <div className='rounded-2xl p-6' style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='mb-1.5 block text-sm font-medium' style={{ color: 'var(--text)' }}>
                Username
              </label>
              <input
                type='text'
                autoComplete='username'
                required
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                placeholder='admin'
                className='w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors'
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label className='mb-1.5 block text-sm font-medium' style={{ color: 'var(--text)' }}>
                Password
              </label>
              <div className='relative'>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete='current-password'
                  required
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder='••••••••'
                  className='w-full rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-colors'
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
                <button
                  type='button'
                  onClick={() => setShowPw((p) => !p)}
                  className='absolute right-3 top-1/2 -translate-y-1/2'
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPw ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                </button>
              </div>
            </div>

            {error && (
              <p className='rounded-xl px-3 py-2 text-sm' style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                Invalid credentials
              </p>
            )}

            <Button type='submit' loading={isPending} className='w-full mt-1' size='lg'>
              Sign in
            </Button>
          </form>
        </div>

        <p className='mt-6 text-center text-xs' style={{ color: 'var(--text-muted)' }}>
          Set <code className='rounded-md px-1.5 py-0.5' style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>KOAS_AUTH_USERNAME</code> and{' '}
          <code className='rounded-md px-1.5 py-0.5' style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>KOAS_AUTH_PASSWORD</code> to change credentials.
        </p>
      </div>
    </div>
  )
}
