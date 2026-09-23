import api from '@/lib/axios'
import { parseResponse } from './errors'
import { Project, Task, TaskFormData, taskSchema } from '../types'

type TaskAPIProps = { formData: TaskFormData; projectId: Project['_id']; taskId: Task['_id']; status: Task['status'] }

export async function createTask({ formData, projectId }: Pick<TaskAPIProps, 'formData' | 'projectId'>) {
  const { data } = await api.post<string>(`/projects/${projectId}/tasks`, formData)
  return data
}

export async function getTaskById({ projectId, taskId }: Pick<TaskAPIProps, 'projectId' | 'taskId'>) {
  const { data } = await api(`/projects/${projectId}/tasks/${taskId}`)
  return parseResponse(taskSchema, data)
}

export async function updateTask({ projectId, taskId, formData }: Pick<TaskAPIProps, 'formData' | 'projectId' | 'taskId'>) {
  const { data } = await api.put<string>(`/projects/${projectId}/tasks/${taskId}`, formData)
  return data
}

export async function deleteTask({ projectId, taskId }: Pick<TaskAPIProps, 'projectId' | 'taskId'>) {
  const { data } = await api.delete<string>(`/projects/${projectId}/tasks/${taskId}`)
  return data
}

export async function updateStatus({ projectId, taskId, status }: Pick<TaskAPIProps, 'projectId' | 'taskId' | 'status'>) {
  const { data } = await api.post<string>(`/projects/${projectId}/tasks/${taskId}/status`, { status })
  return data
}
