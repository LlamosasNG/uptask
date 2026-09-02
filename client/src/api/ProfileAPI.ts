import api from '@/lib/axios'
import { isAxiosError } from 'axios'
import { UpdateCurrentPasswordForm, UserProfileForm } from '../types'

export async function updateProfile(formData: UserProfileForm) {
  try {
    const url = `/auth/profile`
    const { data } = await api.put<string>(url, formData)
    return data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error, { cause: error })
    }
  }
}

export async function changePassword(formData: UpdateCurrentPasswordForm) {
  try {
    const url = `/auth/updated-password`
    const { data } = await api.post<string>(url, formData)
    return data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error, { cause: error })
    }
  }
}
