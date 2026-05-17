import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/libs/api/client'

export function useLogin() {
  return useMutation({
    mutationFn: (creds: { username: string; password: string }) =>
      api.post<{ token: string }>('/auth/login', creds).then((r) => r.data),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => qc.clear(),
  })
}
