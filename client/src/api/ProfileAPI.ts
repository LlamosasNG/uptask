import api from '@/lib/axios'
import { UpdateCurrentPasswordForm, UserProfileForm } from '../types'

export async function updateProfile(formData: UserProfileForm) {
  const { data } = await api.put<string>('/auth/profile', formData)
  return data
}

export async function changePassword(formData: UpdateCurrentPasswordForm) {
  const { data } = await api.post<string>('/auth/updated-password', formData)
  return data
}
