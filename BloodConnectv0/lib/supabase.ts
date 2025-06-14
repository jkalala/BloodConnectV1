import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a single supabase client for the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lglquyksommwynrhmkvz.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnbHF1eWtzb21td3lucmhta3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDY2NzgsImV4cCI6MjA2NTM4MjY3OH0.9qoIqjYI4p9xxx2nhiDFBG3yRHc-4sQ-bTeuuAW2X3E"

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials:", { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseAnonKey 
  })
  throw new Error("Missing Supabase credentials")
}

// Create a singleton instance for client-side usage
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const getSupabase = () => {
  try {
    if (typeof window === "undefined") {
      // Server-side - create a new instance
      console.log("Creating server-side Supabase client")
      return createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      })
    }

    if (!supabaseInstance) {
      console.log("Creating client-side Supabase instance")
      supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey)
    }
    return supabaseInstance
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    throw error
  }
}

// For server components
export const createServerSupabaseClient = () => {
  try {
    console.log("Creating server component Supabase client")
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  } catch (error) {
    console.error("Error creating server Supabase client:", error)
    throw error
  }
}
