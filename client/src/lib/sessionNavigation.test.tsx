import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { queryKeys } from '@/api/queryKeys'
import LoginView from '@/views/auth/LoginView'
import AppLayout from '@/layouts/AppLayout'
import api from './axios'
import { AUTH_TOKEN_KEY, bindAuthCache, endAuthSession } from './authSession'

vi.mock('react-loader-spinner', () => ({ ProgressBar: () => <span /> }))
const originalAdapter = api.defaults.adapter
afterEach(() => { api.defaults.adapter = originalAdapter; localStorage.clear() })

it.each([true, false])('allows account B to enter without A caches or delayed results (explicit logout: %s)', async (logoutFirst) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  const unbind = bindAuthCache(client)
  client.setQueryData(queryKeys.auth.user(), { _id: 'A', name: 'Ana', email: 'a@example.com' })
  for (const key of [queryKeys.projects.all(), queryKeys.projects.detail('private'), queryKeys.projects.team('private'), queryKeys.tasks.detail('private', 'task')]) {
    client.setQueryData(key, ['A private data'])
  }
  let finishOldRequest!: (value: string[]) => void
  const oldRequest = client.fetchQuery({ queryKey: queryKeys.tasks.detail('private', 'delayed'), queryFn: () => new Promise<string[]>((resolve) => { finishOldRequest = resolve }) }).catch(() => undefined)
  localStorage.setItem(AUTH_TOKEN_KEY, 'A-token')
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[logoutFirst ? '/' : '/auth/login']}><Routes>
    <Route element={<AppLayout />}><Route path="/" element={<p>Protected dashboard</p>} /></Route>
    <Route path="/auth/login" element={<LoginView />} />
  </Routes></MemoryRouter></QueryClientProvider>)
  if (logoutFirst) {
    expect(await screen.findByText('Protected dashboard')).toBeInTheDocument()
    await act(async () => { await endAuthSession() })
    expect(client.getQueryCache().findAll({ queryKey: queryKeys.projects.all() })).toEqual([])
    expect(client.getQueryData(queryKeys.auth.user())).toBeNull()
  }
  expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()

  let releaseUser!: () => void
  api.defaults.adapter = async (config) => {
    if (config.url === '/auth/user') await new Promise<void>((resolve) => { releaseUser = resolve })
    return { config, headers: {}, status: 200, statusText: 'OK', data: config.url === '/auth/login' ? 'B-token' : { _id: 'B', name: 'Bea', email: 'b@example.com' } }
  }
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'b@example.com' } })
  fireEvent.change(screen.getByPlaceholderText('Password de Registro'), { target: { value: 'password-b' } })
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))
  await waitFor(() => expect(releaseUser).toBeTypeOf('function'))
  expect(screen.queryByText('Protected dashboard')).not.toBeInTheDocument()
  await act(async () => { releaseUser(); finishOldRequest(['A private delayed data']); await oldRequest })
  expect(await screen.findByText('Protected dashboard')).toBeInTheDocument()
  expect(client.getQueryData(queryKeys.auth.user())).toMatchObject({ _id: 'B' })
  expect(client.getQueryCache().findAll({ queryKey: queryKeys.projects.all() })).toEqual([])
  unbind()
  client.clear()
})
