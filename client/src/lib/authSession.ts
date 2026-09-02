import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryKeys'

export const AUTH_TOKEN_KEY = 'AUTH_TOKEN'

const listeners = new Set<() => void>()

export function endAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  listeners.forEach((listener) => listener())
}

export function bindAuthCache(queryClient: QueryClient) {
  const clearUser = () => {
    queryClient.removeQueries({ queryKey: queryKeys.auth.user() })
  }

  listeners.add(clearUser)
  return () => listeners.delete(clearUser)
}
