import api from '@/lib/axios'
import { parseResponse } from './errors'
import { Project, TeamMember, TeamMemberForm, teamMembersSchema } from '../types'

type TeamAPIProps = { projectId: Project['_id']; formData: TeamMemberForm; id: TeamMember['_id'] }

export async function findMemberById({ projectId, formData }: Pick<TeamAPIProps, 'projectId' | 'formData'>) {
  const { data } = await api.post(`/projects/${projectId}/team/find`, formData)
  return data
}

export async function addMemberToProject({ projectId, id }: Pick<TeamAPIProps, 'projectId' | 'id'>) {
  const { data } = await api.post<string>(`/projects/${projectId}/team`, { id })
  return data
}

export async function getProjectTeam(projectId: TeamAPIProps['projectId']) {
  const { data } = await api(`/projects/${projectId}/team`)
  return parseResponse(teamMembersSchema, data)
}

export async function removeMemberToProject({ projectId, id }: Pick<TeamAPIProps, 'projectId' | 'id'>) {
  const { data } = await api.delete<string>(`/projects/${projectId}/team/${id}`)
  return data
}
