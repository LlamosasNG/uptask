import axios, { isAxiosError } from 'axios'
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
  async (error: unknown) => {
    const apiError = normalizeApiError(error)
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    const requestAuthorization = isAxiosError(error) ? error.config?.headers.Authorization : undefined
    if (apiError.status === 401 && requestAuthorization === (token ? `Bearer ${token}` : undefined)) {
      await endAuthSession()
    }
    return Promise.reject(apiError)
  }
)

export default api
