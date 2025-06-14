export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          phone: string
          name: string
          blood_type: string
          location: string
          allow_location: boolean
          receive_alerts: boolean
          last_donation: string | null
          medical_conditions: string | null
          available: boolean
          points: number
          phone_verified: boolean
          role: string
        }
        Insert: {
          id?: string
          created_at?: string
          phone: string
          name: string
          blood_type: string
          location: string
          allow_location?: boolean
          receive_alerts?: boolean
          last_donation?: string | null
          medical_conditions?: string | null
          available?: boolean
          points?: number
          phone_verified?: boolean
          role?: string
        }
        Update: {
          id?: string
          created_at?: string
          phone?: string
          name?: string
          blood_type?: string
          location?: string
          allow_location?: boolean
          receive_alerts?: boolean
          last_donation?: string | null
          medical_conditions?: string | null
          available?: boolean
          points?: number
          phone_verified?: boolean
          role?: string
        }
      }
      blood_requests: {
        Row: {
          id: string
          created_at: string
          patient_name: string
          hospital_name: string
          blood_type: string
          units_needed: number
          urgency: string
          contact_name: string
          contact_phone: string
          additional_info: string | null
          status: string
          location: string | null
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          patient_name: string
          hospital_name: string
          blood_type: string
          units_needed: number
          urgency: string
          contact_name: string
          contact_phone: string
          additional_info?: string | null
          status?: string
          location?: string | null
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          patient_name?: string
          hospital_name?: string
          blood_type?: string
          units_needed?: number
          urgency?: string
          contact_name?: string
          contact_phone?: string
          additional_info?: string | null
          status?: string
          location?: string | null
          latitude?: number | null
          longitude?: number | null
        }
      }
      donations: {
        Row: {
          id: string
          created_at: string
          user_id: string
          request_id: string | null
          donation_type: string
          hospital: string
          points_earned: number
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          request_id?: string | null
          donation_type: string
          hospital: string
          points_earned?: number
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          request_id?: string | null
          donation_type?: string
          hospital?: string
          points_earned?: number
          status?: string
        }
      }
      blood_banks: {
        Row: {
          id: string
          created_at: string
          name: string
          address: string
          phone: string
          hours: string
          latitude: number | null
          longitude: number | null
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          address: string
          phone: string
          hours: string
          latitude?: number | null
          longitude?: number | null
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          address?: string
          phone?: string
          hours?: string
          latitude?: number | null
          longitude?: number | null
          status?: string
        }
      }
      blood_inventory: {
        Row: {
          id: string
          created_at: string
          blood_bank_id: string
          blood_type: string
          status: string
          quantity: number
        }
        Insert: {
          id?: string
          created_at?: string
          blood_bank_id: string
          blood_type: string
          status?: string
          quantity?: number
        }
        Update: {
          id?: string
          created_at?: string
          blood_bank_id?: string
          blood_type?: string
          status?: string
          quantity?: number
        }
      }
      rewards: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string
          points_required: number
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description: string
          points_required: number
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string
          points_required?: number
          is_active?: boolean
        }
      }
      user_rewards: {
        Row: {
          id: string
          created_at: string
          user_id: string
          reward_id: string
          redeemed_at: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          reward_id: string
          redeemed_at?: string
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          reward_id?: string
          redeemed_at?: string
          status?: string
        }
      }
      donor_responses: {
        Row: {
          id: string
          created_at: string
          user_id: string
          request_id: string
          status: string
          eta: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          request_id: string
          status: string
          eta?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          request_id?: string
          status?: string
          eta?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
