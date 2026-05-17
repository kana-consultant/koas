import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Loader2, Key, Lock } from 'lucide-react'
import { useCreateMachine } from './machines/_apis'

type AuthType = 'password' | 'key'

export function AddMachinePage() {
  const navigate = useNavigate()
  const { mutate: create, isPending, error } = useCreateMachine()

  const [authType, setAuthType] = useState<AuthType>('password')
  const [form, setForm] = useState({
    name: '',
    description: '',
    host: '',
    port: '22',
    username: '',
    password: '',
    key_path: '',
    passphrase: '',
    tags: '',
  })

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
    const auth =
      authType === 'password'
        ? { type: 'password', password: form.password }
        : { type: 'key_file', path: form.key_path, passphrase: form.passphrase || null }

    create(
      {
        name: form.name,
        description: form.description || null,
        host: form.host,
        port: Number(form.port) || 22,
        username: form.username,
        auth,
        tags,
      },
      { onSuccess: () => navigate({ to: '/machines' }) },
    )
  }

  return (
    <div className='mx-auto max-w-lg space-y-4'>
      {/* Back */}
      <button
        onClick={() => navigate({ to: '/machines' })}
        className='flex items-center gap-2 text-sm transition-colors'
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft className='size-4' />
        Back to machines
      </button>

      <div className='rounded-xl p-6' style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <h2 className='mb-5 text-base font-semibold' style={{ color: 'var(--text)' }}>Add SSH machine</h2>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Name */}
          <Field label='Name' required>
            <input required value={form.name} onChange={set('name')} placeholder='my-server' {...inputProps} />
          </Field>

          {/* Description */}
          <Field label='Description'>
            <input value={form.description} onChange={set('description')} placeholder='Optional' {...inputProps} />
          </Field>

          {/* Host + Port */}
          <div className='grid grid-cols-3 gap-3'>
            <div className='col-span-2'>
              <Field label='Host' required>
                <input required value={form.host} onChange={set('host')} placeholder='192.168.1.10' {...inputProps} />
              </Field>
            </div>
            <Field label='Port'>
              <input type='number' value={form.port} onChange={set('port')} placeholder='22' {...inputProps} />
            </Field>
          </div>

          {/* Username */}
          <Field label='Username' required>
            <input required value={form.username} onChange={set('username')} placeholder='root' {...inputProps} />
          </Field>

          {/* Auth type toggle */}
          <div>
            <p className='mb-1.5 text-sm font-medium' style={{ color: 'var(--text)' }}>Authentication</p>
            <div className='flex gap-2'>
              {(['password', 'key'] as AuthType[]).map((t) => (
                <button
                  key={t}
                  type='button'
                  onClick={() => setAuthType(t)}
                  className='flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors'
                  style={{
                    background: authType === t ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                    color: authType === t ? 'var(--accent)' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {t === 'password' ? <Lock className='size-3.5' /> : <Key className='size-3.5' />}
                  {t === 'password' ? 'Password' : 'SSH key'}
                </button>
              ))}
            </div>
          </div>

          {authType === 'password' ? (
            <Field label='Password' required>
              <input required type='password' value={form.password} onChange={set('password')} placeholder='••••••••' {...inputProps} />
            </Field>
          ) : (
            <div className='space-y-3'>
              <Field label='Key path' required>
                <input required value={form.key_path} onChange={set('key_path')} placeholder='~/.ssh/id_ed25519' {...inputProps} />
              </Field>
              <Field label='Passphrase'>
                <input type='password' value={form.passphrase} onChange={set('passphrase')} placeholder='Leave blank if none' {...inputProps} />
              </Field>
            </div>
          )}

          {/* Tags */}
          <Field label='Tags' hint='Comma-separated'>
            <input value={form.tags} onChange={set('tags')} placeholder='production, web' {...inputProps} />
          </Field>

          {error && (
            <p className='rounded-lg px-3 py-2 text-sm' style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
              Failed to add machine
            </p>
          )}

          <div className='flex gap-3 pt-1'>
            <button
              type='button'
              onClick={() => navigate({ to: '/machines' })}
              className='flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors'
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isPending}
              className='flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60'
              style={{ background: 'var(--accent)', color: '#0b0f17' }}
            >
              {isPending && <Loader2 className='size-4 animate-spin' />}
              Add machine
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputProps = {
  className: 'w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors',
  style: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
  } as React.CSSProperties,
}

function Field({ label, children, required, hint }: { label: string; children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div>
      <label className='mb-1.5 flex items-center gap-1 text-sm font-medium' style={{ color: 'var(--text)' }}>
        {label}
        {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        {hint && <span className='ml-auto text-xs font-normal' style={{ color: 'var(--text-muted)' }}>{hint}</span>}
      </label>
      {children}
    </div>
  )
}
