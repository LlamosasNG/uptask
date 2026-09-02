import api from '@/lib/axios'
import { dashboardProjectSchema, editProjectSchema, Project, ProjectFormData, projectSchema } from '@/types/index'
import { parseResponse } from './errors'

type ProjectAPIProps = { formData: ProjectFormData; projectId: Project['_id'] }

export async function createProject(formData: ProjectFormData) {
  const { data } = await api.post<string>('/projects', formData)
  return data
}

export async function getProjects() {
  const { data } = await api('/projects')
  return parseResponse(dashboardProjectSchema, data)
}

export async function getProjectById(id: Project['_id']) {
  const { data } = await api(`/projects/${id}`)
  return parseResponse(editProjectSchema, data)
}

export async function updateProject({ formData, projectId }: Pick<ProjectAPIProps, 'formData' | 'projectId'>) {
  const { data } = await api.put<string>(`/projects/${projectId}`, formData)
  return data
}

export async function deleteProject(projectId: Project['_id']) {
  const { data } = await api.delete<string>(`/projects/${projectId}`)
  return data
}

export async function getFullProject(id: Project['_id']) {
  const { data } = await api(`/projects/${id}`)
  return parseResponse(projectSchema, data)
}
