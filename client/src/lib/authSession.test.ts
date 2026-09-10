import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@/api/queryKeys'
import api from './axios'
import { AUTH_TOKEN_KEY, bindAuthCache, endAuthSession } from './authSession'

describe('expired authentication', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('does not sign account B out when an old account A request returns a delayed 401', async () => {
    const queryClient = new QueryClient()
    const unbind = bindAuthCache(queryClient)
    const previousAdapter = api.defaults.adapter
    let rejectOld!: () => void
    api.defaults.adapter = (config) => new Promise((_resolve, reject) => {
      rejectOld = () => reject(new AxiosError('expired', undefined, config, undefined, {
        data: { error: 'Expired' }, status: 401, statusText: 'Unauthorized', headers: {}, config,
      }))
    })
    localStorage.setItem(AUTH_TOKEN_KEY, 'A-token')
    const pending = api.get('/projects').catch(() => undefined)
    await vi.waitFor(() => expect(rejectOld).toBeTypeOf('function'))
    await endAuthSession()
    localStorage.setItem(AUTH_TOKEN_KEY, 'B-token')
    queryClient.setQueryData(queryKeys.auth.user(), { _id: 'B', name: 'Bea' })
    rejectOld()
    await pending
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('B-token')
    expect(queryClient.getQueryData(queryKeys.auth.user())).toMatchObject({ _id: 'B' })
    api.defaults.adapter = previousAdapter
    unbind()
    queryClient.clear()
  })

  it('moves an active user observer to a settled signed-out state on manual logout', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const unsubscribeSession = bindAuthCache(queryClient)
    const observer = new QueryObserver(queryClient, {
      queryKey: queryKeys.auth.user(),
      queryFn: () => new Promise(() => undefined),
    })
    const unsubscribeObserver = observer.subscribe(() => undefined)
    localStorage.setItem(AUTH_TOKEN_KEY, 'active-token')

    await endAuthSession()

    await vi.waitFor(() => {
      expect(queryClient.getQueryData(queryKeys.auth.user())).toBeNull()
      expect(observer.getCurrentResult()).toMatchObject({
        data: null,
        isFetching: false,
        status: 'success',
      })
    })

    unsubscribeObserver()
    unsubscribeSession()
  })

  it('clears the token and cached user after a 401 response', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
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

    const observer = new QueryObserver(queryClient, {
      queryKey: queryKeys.auth.user(),
      queryFn: () => api.get('/auth/user'),
    })
    const unsubscribeObserver = observer.subscribe(() => undefined)

    await vi.waitFor(() => {
      expect(queryClient.getQueryData(queryKeys.auth.user())).toBeNull()
      expect(observer.getCurrentResult().isFetching).toBe(false)
      expect(observer.getCurrentResult()).toMatchObject({
        data: null,
        status: 'success',
      })
    })

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()

    api.defaults.adapter = previousAdapter
    unsubscribeObserver()
    unsubscribe()
  })
})
