"use client"

import { getSupabase } from "./supabase"
import { toast } from "@/hooks/use-toast"

export interface SyncQueueItem {
  id: string
  type: 'create' | 'update' | 'delete'
  table: string
  data: any
  timestamp: number
  retryCount: number
  lastError?: string
}

export interface OfflineData {
  bloodRequests: any[]
  donors: any[]
  userProfile: any
  responses: any[]
  lastSyncTimestamp: number
}

export class OfflineSyncService {
  private supabase = getSupabase()
  private syncQueue: SyncQueueItem[] = []
  private offlineData: OfflineData | null = null
  private isOnline = true
  private syncInProgress = false
  private readonly STORAGE_KEY = 'bloodconnect_offline_data'
  private readonly SYNC_QUEUE_KEY = 'bloodconnect_sync_queue'
  private readonly MAX_RETRY_COUNT = 3

  constructor() {
    this.initialize()
  }

  private initialize() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
    
    // Load offline data and sync queue from localStorage
    this.loadOfflineData()
    this.loadSyncQueue()

    // Set initial online status
    this.isOnline = navigator.onLine

    // Start periodic sync when online
    if (this.isOnline) {
      this.startPeriodicSync()
    }
  }

  private handleOnline() {
    console.log('Device went online')
    this.isOnline = true
    this.syncOfflineChanges()
    this.startPeriodicSync()
    
    toast({
      title: "Back Online",
      description: "Synchronizing your data..."
    })
  }

  private handleOffline() {
    console.log('Device went offline')
    this.isOnline = false
    this.stopPeriodicSync()
    
    toast({
      title: "Offline Mode",
      description: "You can continue using the app. Changes will sync when back online.",
      variant: "destructive"
    })
  }

  private syncIntervalId: NodeJS.Timeout | null = null

  private startPeriodicSync() {
    if (this.syncIntervalId) return
    
    // Sync every 30 seconds when online
    this.syncIntervalId = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncWithServer()
      }
    }, 30000)
  }

  private stopPeriodicSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId)
      this.syncIntervalId = null
    }
  }

  /**
   * Store data for offline access
   */
  public async cacheForOffline(data: Partial<OfflineData>): Promise<void> {
    try {
      if (!this.offlineData) {
        this.offlineData = {
          bloodRequests: [],
          donors: [],
          userProfile: null,
          responses: [],
          lastSyncTimestamp: Date.now()
        }
      }

      // Update cached data
      if (data.bloodRequests !== undefined) {
        this.offlineData.bloodRequests = data.bloodRequests
      }
      if (data.donors !== undefined) {
        this.offlineData.donors = data.donors
      }
      if (data.userProfile !== undefined) {
        this.offlineData.userProfile = data.userProfile
      }
      if (data.responses !== undefined) {
        this.offlineData.responses = data.responses
      }

      this.offlineData.lastSyncTimestamp = Date.now()

      // Store in localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.offlineData))
    } catch (error) {
      console.error('Error caching data for offline:', error)
    }
  }

  /**
   * Get cached offline data
   */
  public getOfflineData(): OfflineData | null {
    return this.offlineData
  }

  /**
   * Add operation to sync queue
   */
  public queueOperation(operation: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): void {
    const queueItem: SyncQueueItem = {
      ...operation,
      id: `${operation.type}_${operation.table}_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0
    }

    this.syncQueue.push(queueItem)
    this.saveSyncQueue()

    // Try to sync immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.syncOfflineChanges()
    }
  }

  /**
   * Create blood request (works offline)
   */
  public async createBloodRequestOffline(requestData: any): Promise<string> {
    const tempId = `temp_${Date.now()}_${Math.random()}`
    
    try {
      if (this.isOnline) {
        // Try to create online first
        const { data, error } = await this.supabase
          .from('blood_requests')
          .insert(requestData)
          .select()
          .single()

        if (!error && data) {
          // Update offline cache
          await this.addToOfflineCache('bloodRequests', data)
          return data.id
        }
      }

      // If offline or online creation failed, queue the operation
      const requestWithTempId = { ...requestData, id: tempId, _isTemp: true }
      await this.addToOfflineCache('bloodRequests', requestWithTempId)

      this.queueOperation({
        type: 'create',
        table: 'blood_requests',
        data: requestData
      })

      toast({
        title: "Request Queued",
        description: this.isOnline ? "Request will be processed shortly." : "Request saved. Will sync when back online."
      })

      return tempId
    } catch (error) {
      console.error('Error creating blood request offline:', error)
      throw error
    }
  }

  /**
   * Update user response (works offline)
   */
  public async updateResponseOffline(responseId: string, responseData: any): Promise<void> {
    try {
      if (this.isOnline) {
        // Try to update online first
        const { error } = await this.supabase
          .from('donor_responses')
          .update(responseData)
          .eq('id', responseId)

        if (!error) {
          // Update offline cache
          await this.updateOfflineCache('responses', responseId, responseData)
          return
        }
      }

      // If offline or online update failed, queue the operation
      await this.updateOfflineCache('responses', responseId, responseData)

      this.queueOperation({
        type: 'update',
        table: 'donor_responses',
        data: { id: responseId, ...responseData }
      })

      toast({
        title: "Response Queued",
        description: this.isOnline ? "Response will be updated shortly." : "Response saved. Will sync when back online."
      })
    } catch (error) {
      console.error('Error updating response offline:', error)
      throw error
    }
  }

  /**
   * Sync all offline changes with server
   */
  public async syncOfflineChanges(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return
    }

    this.syncInProgress = true

    try {
      console.log(`Syncing ${this.syncQueue.length} queued operations...`)

      const successfulOperations: string[] = []

      for (const operation of this.syncQueue) {
        try {
          await this.executeQueuedOperation(operation)
          successfulOperations.push(operation.id)
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error)
          
          // Increment retry count
          operation.retryCount++
          operation.lastError = error instanceof Error ? error.message : 'Unknown error'

          // Remove from queue if max retries exceeded
          if (operation.retryCount >= this.MAX_RETRY_COUNT) {
            console.error(`Operation ${operation.id} exceeded max retries, removing from queue`)
            successfulOperations.push(operation.id) // Remove it
          }
        }
      }

      // Remove successful operations from queue
      this.syncQueue = this.syncQueue.filter(op => !successfulOperations.includes(op.id))
      this.saveSyncQueue()

      if (successfulOperations.length > 0) {
        toast({
          title: "Sync Complete",
          description: `${successfulOperations.length} operations synchronized successfully.`
        })
      }
    } catch (error) {
      console.error('Error during sync:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Execute a queued operation
   */
  private async executeQueuedOperation(operation: SyncQueueItem): Promise<void> {
    switch (operation.type) {
      case 'create':
        if (operation.table === 'blood_requests') {
          const { data, error } = await this.supabase
            .from('blood_requests')
            .insert(operation.data)
            .select()
            .single()

          if (error) throw error

          // Update offline cache with real ID
          await this.replaceInOfflineCache('bloodRequests', operation.data, data)
        }
        break

      case 'update':
        if (operation.table === 'donor_responses') {
          const { error } = await this.supabase
            .from('donor_responses')
            .update(operation.data)
            .eq('id', operation.data.id)

          if (error) throw error
        }
        break

      case 'delete':
        const { error } = await this.supabase
          .from(operation.table)
          .delete()
          .eq('id', operation.data.id)

        if (error) throw error

        // Remove from offline cache
        await this.removeFromOfflineCache(operation.table, operation.data.id)
        break

      default:
        throw new Error(`Unknown operation type: ${operation.type}`)
    }
  }

  /**
   * Sync fresh data from server
   */
  public async syncWithServer(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return

    this.syncInProgress = true

    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return

      // Fetch fresh data from server
      const [bloodRequests, donors, userProfile] = await Promise.all([
        this.supabase.from('blood_requests').select('*').order('created_at', { ascending: false }).limit(50),
        this.supabase.from('users').select('*').eq('available', true).limit(100),
        this.supabase.from('users').select('*').eq('id', user.id).single()
      ])

      // Update offline cache with fresh data
      await this.cacheForOffline({
        bloodRequests: bloodRequests.data || [],
        donors: donors.data || [],
        userProfile: userProfile.data
      })

    } catch (error) {
      console.error('Error syncing with server:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Get sync status information
   */
  public getSyncStatus(): {
    isOnline: boolean
    syncInProgress: boolean
    queueSize: number
    lastSyncTimestamp: number | null
  } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      queueSize: this.syncQueue.length,
      lastSyncTimestamp: this.offlineData?.lastSyncTimestamp || null
    }
  }

  /**
   * Clear all offline data and sync queue
   */
  public clearOfflineData(): void {
    this.offlineData = null
    this.syncQueue = []
    localStorage.removeItem(this.STORAGE_KEY)
    localStorage.removeItem(this.SYNC_QUEUE_KEY)
    
    toast({
      title: "Offline Data Cleared",
      description: "All cached data has been removed."
    })
  }

  // Private helper methods
  private loadOfflineData(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this.offlineData = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading offline data:', error)
    }
  }

  private loadSyncQueue(): void {
    try {
      const stored = localStorage.getItem(this.SYNC_QUEUE_KEY)
      if (stored) {
        this.syncQueue = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading sync queue:', error)
    }
  }

  private saveSyncQueue(): void {
    try {
      localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue))
    } catch (error) {
      console.error('Error saving sync queue:', error)
    }
  }

  private async addToOfflineCache(collection: keyof OfflineData, item: any): Promise<void> {
    if (!this.offlineData) return
    
    if (collection === 'bloodRequests') {
      this.offlineData.bloodRequests = [item, ...this.offlineData.bloodRequests]
    } else if (collection === 'donors') {
      this.offlineData.donors = [item, ...this.offlineData.donors]
    } else if (collection === 'responses') {
      this.offlineData.responses = [item, ...this.offlineData.responses]
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.offlineData))
  }

  private async updateOfflineCache(collection: keyof OfflineData, id: string, updates: any): Promise<void> {
    if (!this.offlineData) return

    if (collection === 'responses') {
      const index = this.offlineData.responses.findIndex(item => item.id === id)
      if (index >= 0) {
        this.offlineData.responses[index] = { ...this.offlineData.responses[index], ...updates }
      }
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.offlineData))
  }

  private async replaceInOfflineCache(collection: keyof OfflineData, oldItem: any, newItem: any): Promise<void> {
    if (!this.offlineData) return

    if (collection === 'bloodRequests') {
      const index = this.offlineData.bloodRequests.findIndex(item => item._isTemp && JSON.stringify(item).includes(JSON.stringify(oldItem)))
      if (index >= 0) {
        this.offlineData.bloodRequests[index] = newItem
      }
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.offlineData))
  }

  private async removeFromOfflineCache(table: string, id: string): Promise<void> {
    if (!this.offlineData) return

    switch (table) {
      case 'blood_requests':
        this.offlineData.bloodRequests = this.offlineData.bloodRequests.filter(item => item.id !== id)
        break
      case 'donor_responses':
        this.offlineData.responses = this.offlineData.responses.filter(item => item.id !== id)
        break
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.offlineData))
  }
}

// Singleton instance
let offlineSyncService: OfflineSyncService | null = null

export const getOfflineSyncService = (): OfflineSyncService => {
  if (!offlineSyncService) {
    offlineSyncService = new OfflineSyncService()
  }
  return offlineSyncService
}