import axios from 'axios'
import { clearToken } from '../auth/useAuth'

const client = axios.create({ baseURL: '/' })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('atlas_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only force-logout on 401 when there is an active session.
    // Never redirect during the login request itself (no token → login page).
    if (error.response?.status === 401 && localStorage.getItem('atlas_token')) {
      clearToken()
      window.location.href = '/'
    }
    return Promise.reject(error)
  },
)

export default client
