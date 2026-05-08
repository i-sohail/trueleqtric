// client/src/services/api.js
import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
})

// Request interceptor - attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('tl_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, err => Promise.reject(err))

// Response interceptor - handle errors globally
api.interceptors.response.use(
  res => res,
  err => {
    let message = err.response?.data?.error || err.message || 'Something went wrong'
    if (typeof message === 'object' && message !== null) {
      message = message.message || JSON.stringify(message)
    }
    if (err.response?.status === 401) {
      localStorage.removeItem('tl_token')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    } else if (err.response?.status !== 404) {
      toast.error(message)
    }
    return Promise.reject(err)
  }
)

export default api
