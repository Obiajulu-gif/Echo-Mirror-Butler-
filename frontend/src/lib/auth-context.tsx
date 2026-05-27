import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthContextValue = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function ensureProfile(user: User) {
  const { data, error } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()

  if (error) {
    throw error
  }

  if (data) {
    return
  }

  const { error: insertError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        echo_balance: 0,
        streak: 0,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    )

  if (insertError) {
    throw insertError
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        await ensureProfile(data.session.user).catch((error) => {
          console.error('Failed to ensure profile exists', error)
        })
      }
      if (mounted) {
        setSession(data.session)
        setIsLoading(false)
      }
    }

    void bootstrap()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession?.user) {
        void ensureProfile(nextSession.user).catch((error) => {
          console.error('Failed to ensure profile exists', error)
        })
      }
      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoading,
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [session, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
