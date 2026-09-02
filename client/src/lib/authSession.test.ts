import { QueryClient } from '@tanstack/react-query'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it } from 'vitest'
import { queryKeys } from '@/api/queryKeys'
import api from './axios'
import { AUTH_TOKEN_KEY, bindAuthCache } from './authSession'

describe('expired authentication', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('clears the token and cached user after a 401 response', async () => {
    const queryClient = new QueryClient()
    const unsubscribe = bindAuthCache(queryClient)
    queryClient.setQueryData(queryKeys.auth.user(), { _id: 'user-1', name: 'Ana' })
    localStorage.setItem(AUTH_TOKEN_KEY, 'expired-token')

    const previousAdapter = api.defaults.adapter
    api.defaults.adapter = async (config) => {
      throw new AxiosError(
        'Request failed with status code 401',
        'ERR_BAD_REQUEST',
        config as InternalAxiosRequestConfig,
        undefined,
        { data: { error: { code: 'UNAUTHENTICATED', message: 'Sesión expirada' } }, status: 401, statusText: 'Unauthorized', headers: {}, config }
      )
    }

    await expect(api.get('/auth/user')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    })

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
    expect(queryClient.getQueryData(queryKeys.auth.user())).toBeUndefined()

    api.defaults.adapter = previousAdapter
    unsubscribe()
  })
})
