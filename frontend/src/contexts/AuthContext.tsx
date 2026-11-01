import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { authApi } from "../lib/api"
import type { AuthResponse, AuthUser } from "../lib/types"

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<AuthResponse>
  logout: () => Promise<void>
  updateProfile: (data: {
    firstName?: string
    lastName?: string
    currentPassword?: string
    newPassword?: string
  }) => Promise<AuthUser & { message: string }>
  checkSession: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  // Verify whether an active session already exists on application mount
  const checkSession = async () => {
    setIsLoading(true)
    try {
      const currentUser = await authApi.me()
      setUser(currentUser)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  const login = async (email: string, password: string) => {
    setError(null)
    try {
      await authApi.login({ email, password })
      // Retrieve the authenticated user's profile
      const currentUser = await authApi.me()
      setUser(currentUser)
    } catch (err: any) {
      const msg = err.message || "Failed to log in."
      setError(msg)
      throw err
    }
  }

  const register = async (email: string, password: string): Promise<AuthResponse> => {
    setError(null)
    try {
      const response = await authApi.register({ email, password })
      return response
    } catch (err: any) {
      const msg = err.message || "Registration failed."
      setError(msg)
      throw err
    }
  }

  const logout = async () => {
    setError(null)
    try {
      await authApi.logout()
    } catch {
      // Even if network error occurs, clear local state
    } finally {
      setUser(null)
    }
  }

  const updateProfile = async (data: {
    firstName?: string
    lastName?: string
    currentPassword?: string
    newPassword?: string
  }): Promise<AuthUser & { message: string }> => {
    setError(null)
    try {
      const updated = await authApi.updateProfile(data)
      setUser((prev) => {
        if (!prev) return updated
        return {
          ...prev,
          ...updated,
          role: updated.role || prev.role,
        }
      })
      return updated
    } catch (err: any) {
      const msg = err.message || "Failed to update profile."
      setError(msg)
      throw err
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        updateProfile,
        checkSession,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
