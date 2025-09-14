import api from '@/lib/axios'
import { isAxiosError } from 'axios'
import {
  Project,
  TeamMember,
  TeamMemberForm,
  teamMembersSchema,
} from '../types'

type TeamAPIProps = {
  projectId: Project['_id']
  formData: TeamMemberForm
  id: TeamMember['_id']
}

export async function findMemberById({
  projectId,
  formData,
}: Pick<TeamAPIProps, 'projectId' | 'formData'>) {
  try {
    const url = `/projects/${projectId}/team/find`
    const { data } = await api.post(url, formData)
    return data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error)
    }
  }
}

export async function addMemberToProject({
  projectId,
  id,
}: Pick<TeamAPIProps, 'projectId' | 'id'>) {
  try {
    const url = `/projects/${projectId}/team`
    const { data } = await api.post<string>(url, { id })
    return data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error)
    }
  }
}

export async function getProjectTeam(projectId: TeamAPIProps['projectId']) {
  try {
    const url = `/projects/${projectId}/team`
    const { data } = await api(url)
    const response = teamMembersSchema.safeParse(data)
    if (response.success) {
      return response.data
    }
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error)
    }
  }
}

export async function removeMemberToProject({
  projectId,
  id,
}: Pick<TeamAPIProps, 'projectId' | 'id'>) {
  try {
    const url = `/projects/${projectId}/team/${id}`
    const { data } = await api.delete<string>(url)
    return data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error)
    }
  }
}
