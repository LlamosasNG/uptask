import axios from 'axios'
import { normalizeApiError } from '@/api/errors'
import { AUTH_TOKEN_KEY, endAuthSession } from './authSession'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = normalizeApiError(error)
    if (apiError.status === 401) endAuthSession()
    return Promise.reject(apiError)
  }
)

export default api
