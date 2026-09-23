import api from '@/lib/axios'
import { AUTH_TOKEN_KEY, endAuthSession } from '@/lib/authSession'
import { parseResponse } from './errors'
import {
  CheckPasswordForm,
  ConfirmToken,
  ForgotPasswordForm,
  NewPasswordForm,
  RequestConfirmationCodeForm,
  UserLoginForm,
  UserRegistrationForm,
  userSchema,
} from '../types'

export async function createAccount(formData: UserRegistrationForm) {
  const { data } = await api.post<string>('/auth/create-account', formData)
  return data
}

export async function confirmAccount(formData: ConfirmToken) {
  const { data } = await api.post<string>('/auth/confirm-account', formData)
  return data
}

export async function requestConfirmationCode(formData: RequestConfirmationCodeForm) {
  const { data } = await api.post<string>('/auth/request-code', formData)
  return data
}

export async function login(formData: UserLoginForm) {
  const { data } = await api.post<string>('/auth/login', formData)
  await endAuthSession()
  localStorage.setItem(AUTH_TOKEN_KEY, data)
}

export async function forgotPassword(formData: ForgotPasswordForm) {
  const { data } = await api.post<string>('/auth/forgot-password', formData)
  return data
}

export async function validateToken(formData: ConfirmToken) {
  const { data } = await api.post<string>('/auth/validate-token', formData)
  return data
}

export async function updatePasswordWithToken({
  formData,
  token,
}: {
  formData: NewPasswordForm
  token: ConfirmToken['token']
}) {
  const { data } = await api.post<string>(`/auth/update-password/${token}`, formData)
  return data
}

export async function getUser() {
  const { data } = await api('/auth/user')
  return parseResponse(userSchema, data)
}

export async function checkPassword(formData: CheckPasswordForm) {
  const { data } = await api.post<string>('/auth/check-password', formData)
  return data
}
