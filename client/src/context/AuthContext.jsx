// client/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('tl_token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api.get('/access/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('tl_token')
          delete api.defaults.headers.common['Authorization']
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/access/login', { email, password })
    const { token, user } = res.data
    localStorage.setItem('tl_token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    return user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('tl_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }, [])

  // Check if user has permission on a module
  const hasPermission = useCallback((module, action = 'read') => {
    if (!user) return false
    if (user.role === 'admin') return true
    if (user.roleRef && user.roleRef.permissions) {
      const perm = user.roleRef.permissions.find(p => p.module === module)
      return perm ? !!perm[action] : false
    }
    // Legacy fallback
    const map = { admin: true, sales: action !== 'delete', finance: action !== 'delete', operations: action !== 'delete', viewer: action === 'read' }
    return map[user.role] || false
  }, [user])

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAuthenticated: !!user, hasPermission, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
