/**
 * Thin fetch wrapper for hiteffect-dis-backend. Every API call in the app goes through `request`.
 * It adds the login token, and logs the user out when the server says the token is no longer valid.
 */

import { APP_ENV, BACKEND_URL } from '@/config/env'

// Backend URL, including the /api prefix: the one for this environment (src/config/env.ts).
// VITE_API_BASE_URL (in .env) overrides it, for example to try a local frontend against UAT.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || BACKEND_URL[APP_ENV]).replace(/\/$/, '')

const TOKEN_KEY = 'hed_token'

/** The saved login token, if any. */
export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set: (token: string | null) => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      // Storage blocked (private mode): the login lasts until the page is closed.
    }
  },
}

/** Called when a request comes back 401, so the app can return to the login screen. */
let onUnauthorized: (() => void) | null = null
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler
}

interface ApiErrorDetail {
  path: string
  message: string
}

/** A failed API call. `status` is 0 when the server could not be reached. */
export class ApiError extends Error {
  readonly status: number
  readonly details: ApiErrorDetail[]

  constructor(message: string, status: number, details: ApiErrorDetail[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

type Query = Record<string, string | number | boolean | undefined>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Query
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Query) {
  // The base may be relative ('/api' in development), so resolve it against the page.
  const url = new URL(API_BASE_URL + path, window.location.origin)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }
  return url
}

export async function request<T>(path: string, { method = 'GET', body, query, signal }: RequestOptions = {}) {
  const token = tokenStore.get()
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      signal,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError(`Cannot reach the server at ${API_BASE_URL}`, 0)
  }

  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const error = data?.error
    if (res.status === 401 && token) onUnauthorized?.()
    throw new ApiError(error?.message ?? `Request failed (${res.status})`, res.status, error?.details)
  }
  return data as T
}

/** A readable message for any error thrown by an API call. */
export function errorMessage(err: unknown) {
  if (err instanceof ApiError && err.details.length > 0) {
    return `${err.message}: ${err.details.map((d) => (d.path ? `${d.path} ${d.message}` : d.message)).join(', ')}`
  }
  return err instanceof Error ? err.message : 'Something went wrong'
}

export const isAbort = (err: unknown) => err instanceof DOMException && err.name === 'AbortError'
