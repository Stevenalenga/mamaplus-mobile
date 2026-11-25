import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AuthContextState, AuthSession, SignUpParams, User } from '../types'
import {
  clearAuthData,
  fetchCurrentUser,
  loadAuthData,
  logoutRequest,
  saveAuthData,
  signInRequest,
  signUpRequest,
} from '../api/client'
import {
  attachNotificationListeners,
  removePushTokenFromServer,
  syncPushTokenWithServer,
  watchAppStateForPushRegistration,
} from '../lib/push-notifications'

const AuthContext = createContext<AuthContextState | undefined>(undefined)

function isSessionExpiredError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return (
    msg.includes('session expired') ||
    msg.includes('not authenticated') ||
    msg.includes('unauthorized') ||
    msg.includes('invalid session')
  )
}

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
              saveAuthData({
                token: saved.token,
                user: fresh.data,
                session: saved.session,
              }).catch(() => {})
            }
          } catch (error) {
            // Pre-session JWTs and revoked sessions must force re-login
            if (isSessionExpiredError(error)) {
              await clearAuthData()
              setUser(null)
              setToken(null)
            }
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

  // Foreground notification listeners (once for app lifetime)
  useEffect(() => attachNotificationListeners(), [])

  // Register Expo push token whenever the user is authenticated
  useEffect(() => {
    if (!token || !user || user.role === 'PENDING') return

    let cancelled = false
    const applyResult = (result: { ok: boolean; token?: string; error?: string }) => {
      if (cancelled) return
      if (result.ok && result.token) {
        expoPushTokenRef.current = result.token
      } else if (result.error) {
        console.warn('[MamaPlus] Push registration:', result.error)
      }
    }

    syncPushTokenWithServer(token).then(applyResult)
    const stopWatch = watchAppStateForPushRegistration(() => token, applyResult)

    return () => {
      cancelled = true
      stopWatch()
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
    const authToken = token
    if (authToken) {
      try {
        await removePushTokenFromServer(authToken, expoPushTokenRef.current)
      } catch {
        // Continue logout even if push unregister fails
      }
      try {
        await logoutRequest(authToken)
      } catch {
        // Local sign-out still proceeds if server revoke fails
      }
      expoPushTokenRef.current = null
    }
    await clearAuthData()
    setUser(null)
    setToken(null)
  }

  /** Updates the in-memory user (and optional refreshed token/session after onboarding). */
  const updateUser = (updatedUser: User, nextToken?: string, session?: AuthSession) => {
    const authToken = nextToken ?? token
    setUser(updatedUser)
    if (nextToken) {
      setToken(nextToken)
    }
    if (authToken) {
      saveAuthData({ token: authToken, user: updatedUser, session }).catch((error) => {
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
