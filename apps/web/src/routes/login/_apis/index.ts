import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/libs/api/client.ts'

export interface ILoginInput {
  username: string
  password: string
}

export interface ILoginResponse {
  token: string
}

export function useLogin() {
  return useMutation({
    mutationFn: (creds: ILoginInput) =>
      api.post<ILoginResponse>('/auth/login', creds).then((r) => r.data),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => qc.clear(),
  })
}
