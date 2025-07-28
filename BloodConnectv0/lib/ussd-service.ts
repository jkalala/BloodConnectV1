"use server"

import { getSupabase } from "./supabase"
import { BloodRequestService } from "./blood-request-service"
import { NotificationService } from "./notification-service"

export interface USSDRequest {
  sessionId: string
  serviceCode: string
  phoneNumber: string
  text: string
}

export interface USSDResponse {
  response: string
  status: 'CON' | 'END'
}

export class USSDService {
  private supabase = getSupabase()
  private bloodRequestService = new BloodRequestService()
  private notificationService = new NotificationService()

  constructor() {
    // Initialize services
  }

  public async handleUSSDRequest(request: USSDRequest): Promise<USSDResponse> {
    try {
      const { sessionId, serviceCode, phoneNumber, text } = request
      
      // Parse the USSD text to determine the current menu level
      const menuLevel = this.parseMenuLevel(text)
      
      switch (menuLevel) {
        case 0:
          return this.showMainMenu()
        case 1:
          return this.handleMainMenuChoice(text, phoneNumber)
        case 2:
          return this.handleBloodRequestMenu(text, phoneNumber)
        case 3:
          return this.handleBloodTypeSelection(text, phoneNumber)
        case 4:
          return this.handleUrgencySelection(text, phoneNumber)
        case 5:
          return this.handleContactInfo(text, phoneNumber)
        case 6:
          return this.handleRequestConfirmation(text, phoneNumber)
        case 7:
          return this.handleDonorResponse(text, phoneNumber)
        case 8:
          return this.handleDonorMenu(text, phoneNumber)
        default:
          return this.showError("Invalid selection. Please try again.")
      }
    } catch (error) {
      console.error('Error handling USSD request:', error)
      return this.showError("An error occurred. Please try again.")
    }
  }

  private parseMenuLevel(text: string): number {
    if (!text || text === '') return 0
    return text.split('*').length
  }

  private showMainMenu(): USSDResponse {
    const menu = `BLOODLINK AFRICA
1. Request Blood
2. Respond to Request
3. Check Status
4. Emergency Alert
5. Help

Enter your choice:`
    
    return {
      response: menu,
      status: 'CON'
    }
  }

  private async handleMainMenuChoice(text: string, phoneNumber: string): Promise<USSDResponse> {
    const choice = text.split('*')[0]
    
    switch (choice) {
      case '1':
        return this.showBloodRequestMenu()
      case '2':
        return this.showDonorMenu()
      case '3':
        return await this.checkRequestStatus(phoneNumber)
      case '4':
        return this.showEmergencyAlert()
      case '5':
        return this.showHelp()
      default:
        return this.showError("Invalid choice. Please try again.")
    }
  }

  private showBloodRequestMenu(): USSDResponse {
    const menu = `BLOOD REQUEST
1. Patient Name
2. Hospital Name
3. Blood Type
4. Units Needed
5. Urgency Level
6. Contact Info

Enter your choice:`
    
    return {
      response: menu,
      status: 'CON'
    }
  }

  private async handleBloodRequestMenu(text: string, phoneNumber: string): Promise<USSDResponse> {
    const parts = text.split('*')
    const choice = parts[1]
    
    switch (choice) {
      case '1':
        return {
          response: "Enter patient name:",
          status: 'CON'
        }
      case '2':
        return {
          response: "Enter hospital name:",
          status: 'CON'
        }
      case '3':
        return this.showBloodTypeMenu()
      case '4':
        return {
          response: "Enter number of units needed (1-10):",
          status: 'CON'
        }
      case '5':
        return this.showUrgencyMenu()
      case '6':
        return {
          response: "Enter contact name:",
          status: 'CON'
        }
      default:
        return this.showError("Invalid choice. Please try again.")
    }
  }

  private showBloodTypeMenu(): USSDResponse {
    const menu = `SELECT BLOOD TYPE
1. A+
2. A-
3. B+
4. B-
5. AB+
6. AB-
7. O+
8. O-

Enter your choice:`
    
    return {
      response: menu,
      status: 'CON'
    }
  }

  private async handleBloodTypeSelection(text: string, phoneNumber: string): Promise<USSDResponse> {
    const parts = text.split('*')
    const choice = parts[2] || parts[1]
    
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    const selectedType = bloodTypes[parseInt(choice) - 1]
    
    if (!selectedType) {
      return this.showError("Invalid blood type selection.")
    }
    
    // Store the selection temporarily (in a real app, you'd use a session store)
    return {
      response: `Blood type selected: ${selectedType}\n\nEnter hospital name:`,
      status: 'CON'
    }
  }

  private showUrgencyMenu(): USSDResponse {
    const menu = `SELECT URGENCY LEVEL
1. Normal (24 hours)
2. Urgent (6 hours)
3. Critical (2 hours)

Enter your choice:`
    
    return {
      response: menu,
      status: 'CON'
    }
  }

  private async handleUrgencySelection(text: string, phoneNumber: string): Promise<USSDResponse> {
    const parts = text.split('*')
    const choice = parts[2] || parts[1]
    
    const urgencyLevels = ['normal', 'urgent', 'critical']
    const selectedUrgency = urgencyLevels[parseInt(choice) - 1]
    
    if (!selectedUrgency) {
      return this.showError("Invalid urgency selection.")
    }
    
    return {
      response: `Urgency level: ${selectedUrgency.toUpperCase()}\n\nEnter contact name:`,
      status: 'CON'
    }
  }

  private async handleContactInfo(text: string, phoneNumber: string): Promise<USSDResponse> {
    const parts = text.split('*')
    const contactName = parts[parts.length - 1]
    
    if (!contactName || contactName.length < 2) {
      return this.showError("Please enter a valid contact name.")
    }
    
    return {
      response: `Contact: ${contactName}\nPhone: ${phoneNumber}\n\nEnter patient name:`,
      status: 'CON'
    }
  }

  private async handleRequestConfirmation(text: string, phoneNumber: string): Promise<USSDResponse> {
    const parts = text.split('*')
    const patientName = parts[parts.length - 1]
    
    if (!patientName || patientName.length < 2) {
      return this.showError("Please enter a valid patient name.")
    }
    
    // In a real implementation, you would collect all the data and create the request
    // For now, we'll show a confirmation message
    return {
      response: `REQUEST CONFIRMED
Patient: ${patientName}
Contact: ${phoneNumber}
Status: Processing

Thank you for using BloodLink Africa. We will notify compatible donors immediately.`,
      status: 'END'
    }
  }

  private showDonorMenu(): USSDResponse {
    const menu = `DONOR RESPONSE
1. View Active Requests
2. Accept Request
3. Decline Request
4. Check My Responses

Enter your choice:`
    
    return {
      response: menu,
      status: 'CON'
    }
  }

  private async handleDonorMenu(text: string, phoneNumber: string): Promise<USSDResponse> {
    const parts = text.split('*')
    const choice = parts[1]
    
    switch (choice) {
      case '1':
        return await this.showActiveRequests(phoneNumber)
      case '2':
        return {
          response: "Enter request ID to accept:",
          status: 'CON'
        }
      case '3':
        return {
          response: "Enter request ID to decline:",
          status: 'CON'
        }
      case '4':
        return await this.showMyResponses(phoneNumber)
      default:
        return this.showError("Invalid choice. Please try again.")
    }
  }

  private async showActiveRequests(phoneNumber: string): Promise<USSDResponse> {
    try {
      const result = await this.bloodRequestService.getBloodRequests()
      
      if (!result.success || !result.data || result.data.length === 0) {
        return {
          response: "No active blood requests at the moment.",
          status: 'END'
        }
      }
      
      let response = "ACTIVE REQUESTS:\n\n"
      result.data.slice(0, 5).forEach((request, index) => {
        response += `${index + 1}. ${request.blood_type} - ${request.hospital_name}\n`
        response += `   Urgency: ${request.urgency.toUpperCase()}\n`
        response += `   ID: ${request.id.slice(0, 8)}\n\n`
      })
      
      response += "To respond, select 2 or 3 from main menu."
      
      return {
        response,
        status: 'END'
      }
    } catch (error) {
      console.error('Error fetching active requests:', error)
      return this.showError("Failed to load active requests.")
    }
  }

  private async handleDonorResponse(text: string, phoneNumber: string): Promise<USSDResponse> {
    const parts = text.split('*')
    const requestId = parts[parts.length - 1]
    
    if (!requestId || requestId.length < 8) {
      return this.showError("Please enter a valid request ID.")
    }
    
    // In a real implementation, you would validate the request ID and process the response
    return {
      response: `Response recorded for request ${requestId.slice(0, 8)}.\n\nThank you for your response!`,
      status: 'END'
    }
  }

  private async showMyResponses(phoneNumber: string): Promise<USSDResponse> {
    try {
      // Get user by phone number
      const { data: user } = await this.supabase
        .from('users')
        .select('id')
        .eq('phone', phoneNumber)
        .single()
      
      if (!user) {
        return {
          response: "User not found. Please register first.",
          status: 'END'
        }
      }
      
      // Get user's responses
      const { data: responses } = await this.supabase
        .from('donor_responses')
        .select('*')
        .eq('donor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (!responses || responses.length === 0) {
        return {
          response: "You haven't responded to any requests yet.",
          status: 'END'
        }
      }
      
      let response = "YOUR RESPONSES:\n\n"
      responses.forEach((resp: any, index: number) => {
        response += `${index + 1}. ${resp.response_type.toUpperCase()}\n`
        response += `   Request: ${resp.request_id.slice(0, 8)}\n`
        response += `   Date: ${new Date(resp.created_at).toLocaleDateString()}\n\n`
      })
      
      return {
        response,
        status: 'END'
      }
    } catch (error) {
      console.error('Error fetching responses:', error)
      return this.showError("Failed to load your responses.")
    }
  }

  private async checkRequestStatus(phoneNumber: string): Promise<USSDResponse> {
    try {
      // Get user's blood requests
      const { data: requests } = await this.supabase
        .from('blood_requests')
        .select('*')
        .eq('contact_phone', phoneNumber)
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (!requests || requests.length === 0) {
        return {
          response: "You haven't made any blood requests yet.",
          status: 'END'
        }
      }
      
      let response = "YOUR REQUESTS:\n\n"
      requests.forEach((req: any, index: number) => {
        response += `${index + 1}. ${req.blood_type} - ${req.hospital_name}\n`
        response += `   Status: ${req.status.toUpperCase()}\n`
        response += `   Responses: ${req.response_count || 0}\n\n`
      })
      
      return {
        response,
        status: 'END'
      }
    } catch (error) {
      console.error('Error checking request status:', error)
      return this.showError("Failed to check request status.")
    }
  }

  private showEmergencyAlert(): USSDResponse {
    return {
      response: `EMERGENCY ALERT
For immediate assistance, call:
+1234567890

Or visit the nearest hospital emergency room.

Stay safe!`,
      status: 'END'
    }
  }

  private showHelp(): USSDResponse {
    return {
      response: `BLOODLINK AFRICA HELP

1. Request Blood - Submit a blood request
2. Respond to Request - Accept/decline donor requests
3. Check Status - View your request status
4. Emergency Alert - Get emergency contact info
5. Help - Show this help message

For support: +1234567890`,
      status: 'END'
    }
  }

  private showError(message: string): USSDResponse {
    return {
      response: `ERROR: ${message}\n\nPress any key to continue.`,
      status: 'CON'
    }
  }
}

// Singleton instance
let ussdService: USSDService | null = null

export const getUSSDService = (): USSDService => {
  if (!ussdService) {
    ussdService = new USSDService()
  }
  return ussdService
} 