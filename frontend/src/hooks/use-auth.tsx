"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { User } from "@/types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (emailOrUsername: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (email: string, username: string, password: string, displayName?: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
      if (!token) {
        setIsLoading(false)
        return
      }
      const res = await api.get("/auth/me")
      setUser(res.data.data || res.data)
    } catch {
      setUser(null)
      localStorage.removeItem("accessToken")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchUser() }, [fetchUser])

  const login = async (emailOrUsername: string, password: string, rememberMe?: boolean) => {
    const res = await api.post("/auth/login", { emailOrUsername, password, rememberMe })
    const { accessToken, user: userData } = res.data.data || res.data
    localStorage.setItem("accessToken", accessToken)
    setUser(userData)
  }

  const register = async (email: string, username: string, password: string, displayName?: string) => {
    const res = await api.post("/auth/register", { email, username, password, displayName })
    const { accessToken, user: userData } = res.data.data || res.data
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken)
      setUser(userData)
    }
  }

  const logout = async () => {
    try { await api.post("/auth/logout") } catch {}
    localStorage.removeItem("accessToken")
    setUser(null)
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login"
    }
  }

  const refreshUser = fetchUser

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
