const ACCESS_TOKEN_KEY = 'dnshe_access_token'
const USER_KEY = 'dnshe_user'

export function setAccessToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  }
}

export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  }
  return null
}

export function removeAccessToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}

export function setUser(user: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

export function getUser<T = Record<string, unknown>>(): T | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(USER_KEY)
    if (raw) {
      try {
        return JSON.parse(raw) as T
      } catch {
        return null
      }
    }
  }
  return null
}

export function removeUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY)
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

export function hasRole(role: string): boolean {
  const user = getUser<{ roles?: string[] }>()
  return user?.roles?.includes(role) ?? false
}
