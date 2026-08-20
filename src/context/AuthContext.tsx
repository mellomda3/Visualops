import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '../lib/api'
import { isDemoMode } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthContextValue {
  profile: Profile | null
  loading: boolean
  isDemoMode: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const next = await authApi.getSessionProfile()
    setProfile(next)
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const next = await authApi.getSessionProfile()
        if (alive) setProfile(next)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const next = await authApi.signIn(email, password)
    setProfile(next)
  }, [])

  const signOut = useCallback(async () => {
    await authApi.signOut()
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({
      profile,
      loading,
      isDemoMode,
      signIn,
      signOut,
      refresh,
    }),
    [profile, loading, signIn, signOut, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
