"use client"

import { getSupabase } from "./supabase"
import { toast } from "@/hooks/use-toast"

export interface WebSocketMessage {
  type: 'blood_request' | 'donor_response' | 'emergency_alert' | 'notification' | 'status_update' | 'connected' | 'disconnected'
  data: any
  timestamp: string
  user_id?: string
}

export interface RealTimeEvent {
  id: string
  event_type: string
  user_id?: string
  data: any
  created_at: string
  processed: boolean
}

interface SupabasePayload {
  new: any
  old?: any
  eventType: string
  schema: string
  table: string
}

export class WebSocketService {
  private supabase = getSupabase()
  private channel: any = null
  private listeners: Map<string, Set<(message: WebSocketMessage) => void>> = new Map()
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor() {
    this.initializeRealtime()
  }

  private async initializeRealtime() {
    try {
      // Subscribe to real-time events
      this.channel = this.supabase
        .channel('bloodlink-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'real_time_events'
          },
          (payload: SupabasePayload) => {
            this.handleRealTimeEvent(payload.new as RealTimeEvent)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'blood_requests'
          },
          (payload: SupabasePayload) => {
            this.handleBloodRequestUpdate(payload.new)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'donor_responses'
          },
          (payload: SupabasePayload) => {
            this.handleDonorResponseUpdate(payload.new)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notification_queue'
          },
          (payload: SupabasePayload) => {
            this.handleNotificationUpdate(payload.new)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'emergency_alerts'
          },
          (payload: SupabasePayload) => {
            this.handleEmergencyAlert(payload.new)
          }
        )
        .subscribe((status: string) => {
          console.log('WebSocket connection status:', status)
          this.isConnected = status === 'SUBSCRIBED'
          
          if (this.isConnected) {
            this.reconnectAttempts = 0
            this.notifyListeners('connection', { type: 'connected', data: {}, timestamp: new Date().toISOString() })
          } else {
            this.handleDisconnection()
          }
        })

    } catch (error) {
      console.error('Error initializing WebSocket:', error)
      this.handleDisconnection()
    }
  }

  private handleDisconnection() {
    this.isConnected = false
    this.notifyListeners('connection', { type: 'disconnected', data: {}, timestamp: new Date().toISOString() })
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++
        this.initializeRealtime()
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  private handleRealTimeEvent(event: RealTimeEvent) {
    const message: WebSocketMessage = {
      type: event.event_type as any,
      data: event.data,
      timestamp: event.created_at,
      user_id: event.user_id
    }

    this.notifyListeners(event.event_type, message)
  }

  private handleBloodRequestUpdate(request: any) {
    const message: WebSocketMessage = {
      type: 'blood_request',
      data: request,
      timestamp: new Date().toISOString()
    }

    this.notifyListeners('blood_request', message)
    
    // Show toast notification for new blood requests
    if (request.urgency === 'critical') {
      toast({
        title: "🚨 CRITICAL BLOOD REQUEST",
        description: `${request.blood_type} blood needed at ${request.hospital_name}`,
        variant: "destructive"
      })
    } else if (request.urgency === 'urgent') {
      toast({
        title: "⚠️ URGENT BLOOD REQUEST",
        description: `${request.blood_type} blood needed at ${request.hospital_name}`
      })
    }
  }

  private handleDonorResponseUpdate(response: any) {
    const message: WebSocketMessage = {
      type: 'donor_response',
      data: response,
      timestamp: new Date().toISOString()
    }

    this.notifyListeners('donor_response', message)
  }

  private handleNotificationUpdate(notification: any) {
    const message: WebSocketMessage = {
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString(),
      user_id: notification.user_id
    }

    this.notifyListeners('notification', message)
  }

  private handleEmergencyAlert(alert: any) {
    const message: WebSocketMessage = {
      type: 'emergency_alert',
      data: alert,
      timestamp: new Date().toISOString()
    }

    this.notifyListeners('emergency_alert', message)
    
    // Show emergency alert toast
    toast({
      title: "🚨 EMERGENCY ALERT",
      description: alert.message,
      variant: "destructive"
    })
  }

  private notifyListeners(type: string, message: WebSocketMessage) {
    const listeners = this.listeners.get(type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(message)
        } catch (error) {
          console.error('Error in WebSocket listener:', error)
        }
      })
    }
  }

  public subscribe(type: string, callback: (message: WebSocketMessage) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(callback)

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(type)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.listeners.delete(type)
        }
      }
    }
  }

  public async sendEvent(eventType: string, data: any, userId?: string) {
    try {
      const { error } = await this.supabase
        .from('real_time_events')
        .insert({
          event_type: eventType,
          user_id: userId,
          data: data
        })

      if (error) {
        console.error('Error sending real-time event:', error)
        throw error
      }
    } catch (error) {
      console.error('Error sending WebSocket event:', error)
      throw error
    }
  }

  public isConnectedToServer(): boolean {
    return this.isConnected
  }

  public disconnect() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel)
      this.channel = null
    }
    this.isConnected = false
    this.listeners.clear()
  }
}

// Singleton instance
let websocketService: WebSocketService | null = null

export const getWebSocketService = (): WebSocketService => {
  if (!websocketService) {
    websocketService = new WebSocketService()
  }
  return websocketService
} 