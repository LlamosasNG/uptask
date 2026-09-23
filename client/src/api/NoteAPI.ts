import api from '@/lib/axios'
import { Note, NoteFormData, Project, Task } from '../types'

type NoteAPIType = {
  formData: NoteFormData
  projectId: Project['_id']
  taskId: Task['_id']
  noteId: Note['_id']
}

export async function createNote({ projectId, taskId, formData }: Pick<NoteAPIType, 'projectId' | 'taskId' | 'formData'>) {
  const { data } = await api.post<string>(`/projects/${projectId}/tasks/${taskId}/notes`, formData)
  return data
}

export async function deleteNote({ projectId, taskId, noteId }: Pick<NoteAPIType, 'projectId' | 'taskId' | 'noteId'>) {
  const { data } = await api.delete<string>(`/projects/${projectId}/tasks/${taskId}/notes/${noteId}`)
  return data
}
