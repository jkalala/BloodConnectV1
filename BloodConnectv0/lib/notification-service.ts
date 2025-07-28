import { getSupabase } from "./supabase"

export interface Notification {
  id: string
  user_id: string
  notification_type: string
  title: string
  message: string
  data?: any
  status: string
  created_at: string
}

export class NotificationService {
  private supabase = getSupabase()

  /**
   * Create a notification for a user
   */
  async createNotification(notification: Omit<Notification, 'id' | 'status' | 'created_at'>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('notification_queue')
        .insert({
          user_id: notification.user_id,
          notification_type: notification.notification_type,
          title: notification.title,
          message: notification.message,
          data: notification.data || {},
          status: 'pending'
        })

      if (error) {
        console.error('Error creating notification:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error in createNotification:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string): Promise<{ success: boolean; data?: Notification[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('notification_queue')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error: any) {
      console.error('Error in getUserNotifications:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('notification_queue')
        .update({ status: 'delivered' })
        .eq('id', notificationId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error in markNotificationAsRead:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send emergency alert to all compatible donors
   */
  async sendEmergencyAlert(
    bloodType: string,
    hospital: string,
    location: string,
    urgency: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get all compatible donors
      const compatibilityMatrix: Record<string, string[]> = {
        'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
        'O+': ['O+', 'A+', 'B+', 'AB+'],
        'A-': ['A-', 'A+', 'AB-', 'AB+'],
        'A+': ['A+', 'AB+'],
        'B-': ['B-', 'B+', 'AB-', 'AB+'],
        'B+': ['B+', 'AB+'],
        'AB-': ['AB-', 'AB+'],
        'AB+': ['AB+']
      }

      const compatibleTypes = compatibilityMatrix[bloodType] || []

      // Find compatible donors
      const { data: donors, error: donorsError } = await this.supabase
        .from('users')
        .select('id, name, phone, blood_type, location')
        .in('blood_type', compatibleTypes)
        .eq('available', true)
        .eq('receive_alerts', true)

      if (donorsError) {
        return { success: false, error: donorsError.message }
      }

      if (!donors || donors.length === 0) {
        return { success: false, error: "No compatible donors found" }
      }

      // Create emergency notifications
      const notifications = donors.map((donor: any) => ({
        user_id: donor.id,
        notification_type: 'emergency' as const,
        title: `🚨 EMERGENCY: ${bloodType} Blood Needed`,
        message: `URGENT: ${bloodType} blood needed at ${hospital} in ${location}. This is a ${urgency} emergency. Can you help immediately?`,
        data: {
          blood_type: bloodType,
          hospital: hospital,
          location: location,
          urgency: urgency,
          emergency: true
        }
      }))

      const { error: insertError } = await this.supabase
        .from('notification_queue')
        .insert(notifications)

      if (insertError) {
        return { success: false, error: insertError.message }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error in sendEmergencyAlert:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send blood request notification to compatible donors
   */
  async sendBloodRequestNotification(
    requestId: string,
    bloodType: string,
    hospital: string,
    location: string,
    donors: Array<{ id: string; name: string; distance: number }>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const notifications = donors.map(donor => ({
        user_id: donor.id,
        notification_type: 'blood_request' as const,
        title: `Blood Request - ${bloodType}`,
        message: `${bloodType} blood needed at ${hospital}. Distance: ${donor.distance.toFixed(1)}km. Can you help?`,
        data: {
          request_id: requestId,
          blood_type: bloodType,
          hospital: hospital,
          location: location,
          distance: donor.distance
        }
      }))

      const { error } = await this.supabase
        .from('notification_queue')
        .insert(notifications)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error in sendBloodRequestNotification:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send donor match notification
   */
  async sendDonorMatchNotification(
    requestId: string,
    donorId: string,
    donorName: string,
    bloodType: string,
    hospital: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the request creator's user ID
      const { data: request } = await this.supabase
        .from('blood_requests')
        .select('contact_phone')
        .eq('id', requestId)
        .single()

      if (!request) {
        return { success: false, error: "Request not found" }
      }

      // Find the user by phone number
      const { data: user } = await this.supabase
        .from('users')
        .select('id')
        .eq('phone', request.contact_phone)
        .single()

      if (!user) {
        return { success: false, error: "Request creator not found" }
      }

      const notification = {
        user_id: user.id,
        notification_type: 'donor_match' as const,
        title: 'Donor Found! 🎉',
        message: `${donorName} has accepted your blood request for ${bloodType} at ${hospital}`,
        data: {
          request_id: requestId,
          donor_id: donorId,
          donor_name: donorName,
          blood_type: bloodType,
          hospital: hospital
        }
      }

      const { error } = await this.supabase
        .from('notification_queue')
        .insert(notification)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error in sendDonorMatchNotification:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send donation reminder
   */
  async sendDonationReminder(userId: string, userName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const notification = {
        user_id: userId,
        notification_type: 'reminder' as const,
        title: 'Donation Reminder 💝',
        message: `Hi ${userName}, you're eligible to donate blood again! Your donation can save up to 3 lives.`,
        data: {
          type: 'donation_reminder',
          message: 'You can donate again'
        }
      }

      const { error } = await this.supabase
        .from('notification_queue')
        .insert(notification)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error in sendDonationReminder:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Process pending notifications (this would be called by a background job)
   */
  async processPendingNotifications(): Promise<{ success: boolean; processed: number; error?: string }> {
    try {
      // Get pending notifications
      const { data: notifications, error: fetchError } = await this.supabase
        .from('notification_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(100)

      if (fetchError) {
        return { success: false, processed: 0, error: fetchError.message }
      }

      if (!notifications || notifications.length === 0) {
        return { success: true, processed: 0 }
      }

      let processed = 0
      for (const notification of notifications) {
        try {
          // Here you would integrate with actual push notification service
          // For now, we'll just mark them as sent
          const { error: updateError } = await this.supabase
            .from('notification_queue')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', notification.id)

          if (!updateError) {
            processed++
          }
        } catch (error) {
          console.error('Error processing notification:', notification.id, error)
        }
      }

      return { success: true, processed }
    } catch (error: any) {
      console.error('Error in processPendingNotifications:', error)
      return { success: false, processed: 0, error: error.message }
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService() 