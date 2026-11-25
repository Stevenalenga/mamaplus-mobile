import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AuthContextState, SignUpParams, User } from '../types'
import { clearAuthData, fetchCurrentUser, loadAuthData, saveAuthData, signInRequest, signUpRequest } from '../api/client'
import {
  removePushTokenFromServer,
  syncPushTokenWithServer,
} from '../lib/push-notifications'

const AuthContext = createContext<AuthContextState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const expoPushTokenRef = useRef<string | null>(null)

  useEffect(() => {
    async function restore() {
      try {
        const saved = await loadAuthData()
        if (saved) {
          setUser(saved.user)
          setToken(saved.token)
          try {
            const fresh = await fetchCurrentUser(saved.token)
            if (fresh.success && fresh.data) {
              setUser(fresh.data)
              saveAuthData({ token: saved.token, user: fresh.data }).catch(() => {})
            }
          } catch {
            // Keep cached user if refresh fails (offline / expired token handled on next API call)
          }
        }
      } catch (error) {
        console.warn('Auth restore failed', error)
      } finally {
        setIsLoading(false)
      }
    }

    restore()
  }, [])

  // Register Expo push token whenever the user is authenticated
  useEffect(() => {
    if (!token || !user || user.role === 'PENDING') return

    let cancelled = false
    syncPushTokenWithServer(token).then((result) => {
      if (!cancelled && result.ok && result.token) {
        expoPushTokenRef.current = result.token
      } else if (!cancelled && result.error) {
        console.warn('[MamaPlus] Push registration:', result.error)
      }
    })

    return () => {
      cancelled = true
    }
  }, [token, user?.id, user?.role])

  const signIn = async (email: string, password: string) => {
    const response = await signInRequest(email, password)
    const auth = response.data
    setUser(auth.user)
    setToken(auth.token)
    saveAuthData(auth).catch((error) => {
      console.warn('Failed to persist auth after sign-in', error)
    })
  }

  const signUp = async (payload: SignUpParams) => {
    const response = await signUpRequest(payload)
    const auth = response.data
    setUser(auth.user)
    setToken(auth.token)
    saveAuthData(auth).catch((error) => {
      console.warn('Failed to persist auth after sign-up', error)
    })
  }

  const signOut = async () => {
    if (token) {
      await removePushTokenFromServer(token, expoPushTokenRef.current)
      expoPushTokenRef.current = null
    }
    await clearAuthData()
    setUser(null)
    setToken(null)
  }

  /** Updates the in-memory user (and optional refreshed token after onboarding). */
  const updateUser = (updatedUser: User, nextToken?: string) => {
    const authToken = nextToken ?? token
    setUser(updatedUser)
    if (nextToken) {
      setToken(nextToken)
    }
    if (authToken) {
      saveAuthData({ token: authToken, user: updatedUser }).catch((error) => {
        console.warn('Failed to persist updated user', error)
      })
    }
  }

  const value = useMemo(
    () => ({ user, token, isLoading, signIn, signUp, signOut, updateUser }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, token, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
