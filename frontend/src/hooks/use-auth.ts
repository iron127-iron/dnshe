'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import api from '@/lib/api'
import {
  setAccessToken,
  getAccessToken,
  removeAccessToken,
  setUser,
  getUser,
  removeUser,
  isAuthenticated as checkIsAuthenticated,
} from '@/lib/auth'
import type { User, LoginResponse, RegisterResponse } from '@/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (emailOrUsername: string, password: string, rememberMe?: boolean) => Promise<LoginResponse>
  register: (email: string, username: string, password: string) => Promise<RegisterResponse>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const syncUser = useCallback(() => {
    const stored = getUser<User>()
    if (stored) {
      setUserState(stored)
    }
  }, [])

  useEffect(() => {
    if (checkIsAuthenticated()) {
      syncUser()
      api
        .get<User>('/auth/me')
        .then(({ data }) => {
          setUserState(data)
          setUser(data as unknown as Record<string, unknown>)
        })
        .catch(() => {
          removeAccessToken()
          removeUser()
          setUserState(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [syncUser])

  const login = useCallback(
    async (emailOrUsername: string, password: string, rememberMe?: boolean) => {
      const { data } = await api.post<LoginResponse>('/auth/login', {
        emailOrUsername,
        password,
        rememberMe,
      })

      if (!data.requiresTwoFactor) {
        setAccessToken(data.accessToken)
        setUser(data.user as unknown as Record<string, unknown>)
        setUserState(data.user)
      }

      return data
    },
    []
  )

  const register = useCallback(async (email: string, username: string, password: string) => {
    const { data } = await api.post<RegisterResponse>('/auth/register', {
      email,
      username,
      password,
    })

    setAccessToken(data.accessToken)
    setUser(data.user as unknown as Record<string, unknown>)
    setUserState(data.user)

    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
    } finally {
      removeAccessToken()
      removeUser()
      setUserState(null)
    }
  }, [])

  const refreshToken = useCallback(async () => {
    try {
      const { data } = await api.post<{ accessToken: string }>('/auth/refresh')
      setAccessToken(data.accessToken)
    } catch {
      removeAccessToken()
      removeUser()
      setUserState(null)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
