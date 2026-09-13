import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryKeys'

export const AUTH_TOKEN_KEY = 'AUTH_TOKEN'

const listeners = new Set<() => Promise<void>>()
let authSessionVersion = 0

export function getAuthSessionVersion() {
  return authSessionVersion
}

export async function endAuthSession() {
  authSessionVersion += 1
  localStorage.removeItem(AUTH_TOKEN_KEY)
  await Promise.all(Array.from(listeners, (listener) => listener()))
}

export function bindAuthCache(queryClient: QueryClient) {
  const clearUser = async () => {
    await queryClient.cancelQueries(
      { queryKey: queryKeys.auth.user(), exact: true }, { revert: false }
    )
    queryClient.setQueryData(queryKeys.auth.user(), null)
    await queryClient.cancelQueries({ queryKey: queryKeys.projects.all() })
    queryClient.removeQueries({ queryKey: queryKeys.projects.all() })
  }

  listeners.add(clearUser)
  return () => listeners.delete(clearUser)
}
