import { apiClient } from '@/libs/axios'
import type { CreateServerPayload, ListResponse, Server, SingleResponse } from './types'

const BASE = '/servers'

export const serversService = {
  list: () => apiClient.get<ListResponse<Server>>(BASE),
  get: (id: string) => apiClient.get<SingleResponse<Server>>(`${BASE}/${id}`),
  create: (payload: CreateServerPayload) =>
    apiClient.post<SingleResponse<Server>>(BASE, payload),
  delete: (id: string) => apiClient.delete(`${BASE}/${id}`),
}
