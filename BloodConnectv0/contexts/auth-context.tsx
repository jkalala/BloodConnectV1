"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase"
import type { Session, User } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

type DatabaseUser = Database['public']['Tables']['users']['Row']

interface AuthContextType {
  user: DatabaseUser | null
  session: Session | null
  isLoading: boolean
  signIn: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (phone: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  setUser?: (user: DatabaseUser | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to format phone number
const formatPhoneNumber = (phone: string) => {
  // Remove any non-digit characters except +
  let formatted = phone.replace(/[^\d+]/g, '')
  
  // Ensure it starts with +
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted
  }
  
  return formatted
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DatabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabase()

  const createUserProfile = async (authUser: User): Promise<DatabaseUser | null> => {
    try {
      console.log('Starting createUserProfile for:', authUser.id)

      // First check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (checkError) {
        console.log('Raw check error:', checkError)
        console.log('Error checking for existing user:', {
          error: checkError,
          userId: authUser.id
        })
      }

      if (existingUser) {
        console.log('Found existing user:', existingUser.id)
        return existingUser
      }

      console.log('No existing user found, creating new profile')

      // Get phone from either phone field or email (for backward compatibility)
      const phone = authUser.phone || (
        authUser.email ? authUser.email.replace('@bloodlink.app', '') : null
      )

      if (!phone) {
        console.error('No phone number available for user:', authUser.id)
        return null
      }

      // Create new user profile
      const newUser = {
        id: authUser.id,
        phone: formatPhoneNumber(phone),
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        blood_type: authUser.user_metadata?.blood_type || 'Unknown',
        location: authUser.user_metadata?.location || 'Unknown',
        allow_location: true,
        receive_alerts: true,
        available: true,
        points: 0,
        role: 'donor',
        stakeholder_type: 'donor',
        verification_status: 'pending',
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        emergency_access: false,
        phone_verified: false,
        permissions: {},
        last_donation: null,
        medical_conditions: null,
        institution_id: null
      }

      console.log('Attempting to create user:', newUser)

      // Try direct insert
      const { error: insertError } = await supabase
        .from('users')
        .insert([newUser])

      if (insertError) {
        console.log('Raw insert error:', insertError)
        console.error('Insert error:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        })
      }

      // Fetch the created user
      const { data: createdUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (fetchError) {
        console.log('Raw fetch error:', fetchError)
        console.error('Error fetching created user:', {
          code: fetchError.code,
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint
        })
        return null
      }

      if (!createdUser) {
        console.error('No user found after creation')
        return null
      }

      console.log('Successfully created/fetched user:', createdUser.id)
      return createdUser
    } catch (error) {
      console.log('Raw unexpected error:', error)
      console.error('Unexpected error in createUserProfile:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        userId: authUser.id,
        metadata: authUser.user_metadata
      })
      return null
    }
  }

  useEffect(() => {
    const setupAuth = async () => {
      try {
        console.log('Starting auth setup')
        setIsLoading(true)

        // Check active session
        const { data: { session: activeSession } } = await supabase.auth.getSession()
        console.log('Got active session:', activeSession?.user?.id)
        setSession(activeSession)

        if (activeSession?.user) {
          console.log('Creating profile for active session user')
          const profile = await createUserProfile(activeSession.user)
          setUser(profile)
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          console.log('Auth state changed:', event, currentSession?.user?.id)
          setSession(currentSession)
          
          if (currentSession?.user) {
            console.log('Creating profile for new session user')
            const profile = await createUserProfile(currentSession.user)
            setUser(profile)
          } else {
            setUser(null)
          }
          
          setIsLoading(false)
        })

        setIsLoading(false)

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Error in setupAuth:', {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        })
        setIsLoading(false)
      }
    }

    setupAuth()
  }, [supabase])

  const signIn = async (phone: string, password: string) => {
    try {
      console.log('Attempting sign in for:', phone)
      const formattedPhone = formatPhoneNumber(phone)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${formattedPhone}@bloodlink.app`,
        password,
      })

      if (error) {
        console.error('Sign in error:', error)
        return { success: false, error: error.message }
      }

      // Update user metadata - preserve existing name if available
      if (data.user) {
        const existingName = data.user.user_metadata?.name || data.user.user_metadata?.full_name
        await supabase.auth.updateUser({
          data: {
            name: existingName || data.user.email?.split('@')[0] || 'User',
            blood_type: data.user.user_metadata?.blood_type || 'Unknown',
            location: data.user.user_metadata?.location || 'Angola',
            phone: formattedPhone
          }
        })
      }

      console.log('Sign in successful:', data.user?.id)
      return { success: true }
    } catch (error: any) {
      console.error('Unexpected sign in error:', error)
      return { success: false, error: error.message }
    }
  }

  const signUp = async (phone: string, password: string, name: string) => {
    try {
      console.log('Attempting sign up for:', phone)
      const formattedPhone = formatPhoneNumber(phone)
      const { data, error } = await supabase.auth.signUp({
        email: `${formattedPhone}@bloodlink.app`,
        password,
        phone: formattedPhone,
        options: {
          data: {
            name,
            phone: formattedPhone,
            blood_type: 'Unknown',
            location: 'Angola'
          }
        }
      })

      if (error) {
        console.error('Sign up error:', error)
        return { success: false, error: error.message }
      }

      console.log('Sign up successful:', data.user?.id)
      return { success: true }
    } catch (error: any) {
      console.error('Unexpected sign up error:', error)
      return { success: false, error: error.message }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    setUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
