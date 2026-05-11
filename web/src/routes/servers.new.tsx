import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useCreateServer } from '@/apis/servers'

export function NewServerPage() {
  const navigate = useNavigate()
  const { mutate: createServer, isPending, error } = useCreateServer()

  const [form, setForm] = useState({
    name: '',
    host: '',
    port: 9000,
    token: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createServer(form, {
      onSuccess: () => navigate({ to: '/' }),
    })
  }

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [key]: key === 'port' ? Number(e.target.value) : e.target.value })),
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-lg font-medium text-zinc-100">Register Server</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {([
          { key: 'name', label: 'Name', placeholder: 'prod-01', type: 'text' },
          { key: 'host', label: 'Host', placeholder: '192.168.1.1', type: 'text' },
          { key: 'port', label: 'Agent Port', placeholder: '9000', type: 'number' },
          { key: 'token', label: 'Agent Token', placeholder: 'secret', type: 'password' },
        ] as const).map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label className="mb-1.5 block text-xs text-zinc-400">{label}</label>
            <input
              type={type}
              placeholder={placeholder}
              required
              className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
              {...field(key)}
            />
          </div>
        ))}

        {error && (
          <p className="text-xs text-red-400">
            {(error as Error).message ?? 'Failed to register server'}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded border border-zinc-600 bg-zinc-800 px-4 py-2 text-xs font-mono text-zinc-200 transition-colors hover:border-zinc-400 hover:text-white disabled:opacity-50"
          >
            {isPending ? 'registering...' : 'register'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/' })}
            className="px-4 py-2 text-xs font-mono text-zinc-500 hover:text-zinc-300"
          >
            cancel
          </button>
        </div>
      </form>
    </div>
  )
}
