import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryKeys'

export const AUTH_TOKEN_KEY = 'AUTH_TOKEN'

const listeners = new Set<() => Promise<void>>()

export async function endAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  await Promise.all(Array.from(listeners, (listener) => listener()))
}

export function bindAuthCache(queryClient: QueryClient) {
  const clearUser = async () => {
    queryClient.setQueryData(queryKeys.auth.user(), null)
    await queryClient.cancelQueries(
      { queryKey: queryKeys.auth.user(), exact: true }
    )
  }

  listeners.add(clearUser)
  return () => listeners.delete(clearUser)
}
