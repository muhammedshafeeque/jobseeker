import { API_BASE_URL } from '../Constants/Config'
import { tokenStore } from './tokenStore'

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = tokenStore.get()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers as Record<string, string> | undefined),
  }

  const res = await fetch(API_BASE_URL + path, { ...opts, headers })

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const data = await res.json()
      message = data?.error ?? data?.message ?? message
    } catch {
      // ignore parse error
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' })
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined })
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined })
  },
  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined })
  },
  del<T>(path: string, opts?: { data?: unknown }): Promise<T> {
    return request<T>(path, {
      method: 'DELETE',
      body: opts?.data !== undefined ? JSON.stringify(opts.data) : undefined,
    })
  },
  delete<T>(path: string, opts?: { data?: unknown }): Promise<T> {
    return request<T>(path, {
      method: 'DELETE',
      body: opts?.data !== undefined ? JSON.stringify(opts.data) : undefined,
    })
  },
}
