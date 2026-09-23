import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import api from '@/lib/axios'
import { queryKeys } from '@/api/queryKeys'
import ProjectTeamView from './ProjectTeamView'

vi.mock('react-loader-spinner', () => ({ ProgressBar: () => <span /> }))

const originalAdapter = api.defaults.adapter
beforeEach(() => { vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} }) })
afterEach(() => { api.defaults.adapter = originalAdapter; vi.unstubAllGlobals() })
const project = { _id: 'p', projectName: 'Atlas', clientName: 'Client', description: 'Description', manager: 'manager', team: ['member'], tasks: [] }
const member = { _id: 'member', name: 'Marta', email: 'marta@example.com' }
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  client.setQueryData(queryKeys.auth.user(), { _id: 'manager', name: 'Ana', email: 'ana@example.com' })
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/projects/p/team']}><Routes>
    <Route path="/projects/:projectId/team" element={<ProjectTeamView />} />
    <Route path="/404" element={<p>Página no encontrada</p>} />
  </Routes></MemoryRouter></QueryClientProvider>)
  return client
}

it.each([403, 500, 'schema'] as const)('shows the independent project permission error (%s) while the team query succeeds, with retry when recoverable', async (status) => {
  let recovered = false
  api.defaults.adapter = async (config) => {
    if (config.url === '/projects/p' && !recovered) {
      if (status !== 'schema') throw new AxiosError('failed', undefined, config, undefined, { config, headers: {}, status, statusText: 'failed', data: { error: 'No se pueden consultar los permisos' } })
      return { config, headers: {}, status: 200, statusText: 'OK', data: { invalid: true } }
    }
    return { config, headers: {}, status: 200, statusText: 'OK', data: config.url === '/projects/p' ? project : [member] }
  }
  mount()
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(screen.queryByText('Equipo del proyecto')).not.toBeInTheDocument()
  expect(screen.queryByText('Página no encontrada')).not.toBeInTheDocument()
  if (status === 500) {
    recovered = true
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }))
    expect(await screen.findByText('Administrar Equipo')).toBeInTheDocument()
  }
})

it('waits for project permissions independently of a completed team request', async () => {
  api.defaults.adapter = async (config) => {
    if (config.url === '/projects/p') await new Promise(() => undefined)
    return { config, headers: {}, status: 200, statusText: 'OK', data: [member] }
  }
  const client = mount()
  await waitFor(() => expect(client.getQueryData(queryKeys.projects.team('p'))).toEqual([member]))
  expect(await screen.findByRole('status')).toHaveTextContent('Cargando')
  expect(screen.queryByText('Equipo del proyecto')).not.toBeInTheDocument()
})

it('routes an independent project 404 to the existing not-found page', async () => {
  api.defaults.adapter = async (config) => {
    if (config.url === '/projects/p') throw new AxiosError('failed', undefined, config, undefined, { config, headers: {}, status: 404, statusText: 'failed', data: { error: 'Proyecto no encontrado' } })
    return { config, headers: {}, status: 200, statusText: 'OK', data: [member] }
  }
  mount()
  expect(await screen.findByText('Página no encontrada')).toBeInTheDocument()
})

it('requires confirmation to remove access and clears stale project, team and task assignments', async () => {
  let removed = false
  api.defaults.adapter = async (config) => {
    if (config.method === 'delete') removed = true
    return { config, headers: {}, status: 200, statusText: 'OK', data: config.method === 'delete' ? 'Colaborador eliminado' : config.url === '/projects/p' ? { ...project, team: removed ? [] : ['member'] } : removed ? [] : [member] }
  }
  const client = mount()
  client.setQueryData(queryKeys.tasks.detail('p', 'task'), { assignee: member })
  client.setQueryData(queryKeys.projects.edit('p'), project)
  fireEvent.click(await screen.findByRole('button', { name: 'Opciones de Marta' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Eliminar del Proyecto' }))
  const dialog = await screen.findByRole('dialog')
  expect(dialog).toHaveTextContent(/acceso/i)
  expect(dialog).toHaveTextContent(/asignaciones/i)
  expect(removed).toBe(false)
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(removed).toBe(false)
  fireEvent.click(screen.getByRole('button', { name: 'Opciones de Marta' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Eliminar del Proyecto' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))
  expect(await screen.findByText('No hay miembros en este equipo')).toBeInTheDocument()
  await waitFor(() => expect(client.getQueryData(queryKeys.projects.detail('p'))).toMatchObject({ team: [] }))
  expect(client.getQueryState(queryKeys.tasks.detail('p', 'task'))?.isInvalidated).toBe(true)
  expect(client.getQueryState(queryKeys.projects.edit('p'))?.isInvalidated).toBe(true)
})
