export type Server = {
  id: string
  name: string
  host: string
  port: number
  created_at: string
  updated_at: string
}

export type CreateServerPayload = {
  name: string
  host: string
  port: number
  token: string
}

export type SingleResponse<T> = { data: T; message: string }
export type ListResponse<T> = { data: T[]; total: number }
