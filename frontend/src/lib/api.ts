// Thin fetch wrapper for the Express backend. Always sends the session cookie
// (credentials: 'include') and throws on non-2xx with the server's error message.

const BASE = '/api'

export class ApiError extends Error {
  status: number
  code: string | null
  constructor(status: number, message: string, code: string | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })

  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = data?.error
    throw new ApiError(res.status, err?.message || res.statusText, err?.code ?? null)
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
}

// Auth helpers (these hit /auth, not the /api base).
export const auth = {
  // Full navigation — /auth/login 302-redirects to Spotify.
  login: () => {
    window.location.href = '/auth/login'
  },
  me: async (): Promise<SelfUser | null> => {
    const res = await fetch('/auth/me', { credentials: 'include' })
    if (res.status === 401) return null // not logged in
    if (!res.ok) throw new ApiError(res.status, res.statusText)
    const data = await res.json()
    return data.user as SelfUser
  },
  logout: () =>
    fetch('/auth/logout', { method: 'POST', credentials: 'include' }).then(() => undefined),
}

// Shape returned by /auth/me and /api/profile (mirrors userService.toSelfUser).
export interface SelfUser {
  id: string
  spotifyProfile: {
    displayName: string
    email: string | null
    imageUrl: string | null
    country: string | null
    product: string | null
  } | null
  profile: { displayName: string; bio: string }
  isPublic: boolean
  displayedArtists: string[]
  displayedSongs: string[]
  displayedRange: string
}

// Shapes from spotifyApiService.
export interface Artist {
  id: string
  name: string
  images: { url: string }[]
  genres: string[]
  externalUrl: string | null
}
export interface Track {
  id: string
  name: string
  artists: string[]
  album: { name: string; images: { url: string }[] }
  externalUrl: string | null
  previewUrl: string | null
  addedAt?: string
}

export type RangeKey = 'all_time' | 'six_months' | 'one_month'

// Spotify data endpoints (all under /api/spotify, require auth cookie).
export const spotify = {
  me: () => api.get<{ profile: unknown }>('/spotify/me'),
  topArtists: (range: RangeKey) =>
    api.get<{ range: RangeKey; items: Artist[] }>(`/spotify/top/artists?range=${range}`),
  topTracks: (range: RangeKey) =>
    api.get<{ range: RangeKey; items: Track[] }>(`/spotify/top/tracks?range=${range}`),
  liked: (limit = 50, offset = 0) =>
    api.get<{ items: Track[]; next: string | null; total: number }>(
      `/spotify/liked?limit=${limit}&offset=${offset}`
    ),
}
