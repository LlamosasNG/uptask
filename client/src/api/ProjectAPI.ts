import api from '@/lib/axios'
import {
  dashboardProjectSchema,
  editProjectSchema,
  Project,
  ProjectFormData,
  projectSchema,
} from '@/types/index'
import { isAxiosError } from 'axios'

type ProjectAPIProps = {
  formData: ProjectFormData
  projectId: Project['_id']
}

export async function createProject(formData: ProjectFormData) {
  try {
    const { data } = await api.post<string>('/projects', formData)
    return data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error, { cause: error })
    }
  }
}

export async function getProjects() {
  try {
    const { data } = await api('/projects')
    const response = dashboardProjectSchema.safeParse(data)
    if (response.success) {
      return response.data
    }
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error, { cause: error })
    }
  }
}

export async function getProjectById(id: Project['_id']) {
  try {
    const { data } = await api(`/projects/${id}`)
    const response = editProjectSchema.safeParse(data)
    if (response.success) {
      return response.data
    }
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error, { cause: error })
    }
  }
}

export async function updateProject({
  formData,
  projectId,
}: Pick<ProjectAPIProps, 'formData' | 'projectId'>) {
  try {
    const { data } = await api.put<string>(`/projects/${projectId}`, formData)
    return data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error, { cause: error })
    }
  }
}

export async function deleteProject(projectId: Project['_id']) {
  try {
    const { data } = await api.delete<string>(`/projects/${projectId}`)
    return data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error, { cause: error })
    }
  }
}

export async function getFullProject(id: Project['_id']) {
  try {
    const { data } = await api(`/projects/${id}`)
    const response = projectSchema.safeParse(data)
    if (response.success) {
      return response.data
    }
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error, { cause: error })
    }
  }
}

