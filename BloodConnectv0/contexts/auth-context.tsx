"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase"
import type { Session, User } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (phone: string, password: string) => Promise<{ error: any | null }>
  signUp: (userData: any) => Promise<{ error: any | null; data: any | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabase()

  useEffect(() => {
    if (!supabase) return

    const setupAuth = async () => {
      setIsLoading(true)

      // Check active session
      const {
        data: { session: activeSession },
      } = await supabase.auth.getSession()
      setSession(activeSession)
      setUser(activeSession?.user ?? null)

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setIsLoading(false)
      })

      setIsLoading(false)

      return () => {
        subscription.unsubscribe()
      }
    }

    setupAuth()
  }, [supabase])

  const signIn = async (phone: string, password: string) => {
    if (!supabase) return { error: new Error("Supabase client not initialized") }

    try {
      // For Supabase auth, we need to use email, so we'll construct one from the phone
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${phone}@bloodlink.app`,
        password,
      })

      if (!error) {
        router.push("/dashboard")
      }

      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signUp = async (userData: any) => {
    if (!supabase) return { error: new Error("Supabase client not initialized"), data: null }

    try {
      console.log("Starting registration for phone:", userData.phone)
      
      // First check if user exists in the users table
      const { data: existingUsers, error: usersError } = await supabase
        .from("users")
        .select("phone")
        .eq("phone", userData.phone)

      console.log("Users table check:", { existingUsers, usersError })

      if (usersError) {
        console.error("Error checking users table:", usersError)
      }

      if (existingUsers && existingUsers.length > 0) {
        console.log("User found in users table")
        return { 
          error: new Error("A user with this phone number already exists in the users table. Please try logging in instead."), 
          data: null 
        }
      }

      // Try to create the auth user
      console.log("Attempting to create auth user")
      const { data, error } = await supabase.auth.signUp({
        email: `${userData.phone}@bloodlink.app`,
        password: userData.password,
        phone: userData.phone,
        options: {
          data: {
            name: userData.name,
            blood_type: userData.bloodType,
          },
        },
      })

      console.log("Auth signup result:", { data, error })

      if (error) {
        if (error.message.includes("already registered")) {
          console.log("User already registered in auth system")
          return { 
            error: new Error("A user with this phone number already exists in the auth system. Please try logging in instead."), 
            data: null 
          }
        }
        return { error, data: null }
      }

      // Then create the user profile
      if (data.user) {
        console.log("Creating user profile")
        const { error: profileError } = await supabase.from("users").insert({
          id: data.user.id,
          phone: userData.phone,
          name: userData.name,
          blood_type: userData.bloodType,
          location: userData.location || "Unknown",
          allow_location: userData.allowLocation,
          receive_alerts: userData.receiveAlerts,
          last_donation: userData.lastDonation || null,
          medical_conditions: userData.medicalConditions || null,
        })

        if (profileError) {
          console.error("Error creating user profile:", profileError)
          // If profile creation fails, sign out
          await supabase.auth.signOut()
          return { error: profileError, data: null }
        }

        console.log("User profile created successfully")
        // Auto sign in the user after registration
        await supabase.auth.signInWithPassword({
          email: `${userData.phone}@bloodlink.app`,
          password: userData.password,
        })
      }

      return { error: null, data }
    } catch (error) {
      console.error("Unexpected error during registration:", error)
      return { error, data: null }
    }
  }

  const signOut = async () => {
    if (!supabase) return

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
