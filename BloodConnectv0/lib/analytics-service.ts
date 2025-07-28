import { getSupabase } from "./supabase"

export interface AnalyticsData {
  total_donors: number
  total_requests: number
  total_donations: number
  success_rate: number
  avg_response_time: number
  blood_type_distribution: Record<string, number>
  location_heatmap: Array<{ location: string; count: number; coordinates: [number, number] }>
  time_series_data: Array<{ date: string; requests: number; donations: number }>
  demand_forecast: Array<{ date: string; predicted_demand: number; confidence: number }>
  efficiency_metrics: {
    matching_efficiency: number
    response_efficiency: number
    completion_efficiency: number
  }
}

export interface DonorAnalytics {
  donor_id: string
  total_donations: number
  avg_response_time: number
  success_rate: number
  preferred_times: string[]
  preferred_locations: string[]
  blood_type: string
  reliability_score: number
}

export interface RequestAnalytics {
  request_id: string
  blood_type: string
  urgency: string
  response_count: number
  time_to_match: number
  completion_time: number
  location: string
  success: boolean
}

export class AnalyticsService {
  private supabase = getSupabase()

  /**
   * Get comprehensive analytics data
   */
  async getAnalyticsData(): Promise<AnalyticsData> {
    try {
      const [
        totalDonors,
        totalRequests,
        totalDonations,
        bloodTypeDistribution,
        locationHeatmap,
        timeSeriesData,
        demandForecast,
        efficiencyMetrics
      ] = await Promise.all([
        this.getTotalDonors(),
        this.getTotalRequests(),
        this.getTotalDonations(),
        this.getBloodTypeDistribution(),
        this.getLocationHeatmap(),
        this.getTimeSeriesData(),
        this.getDemandForecast(),
        this.getEfficiencyMetrics()
      ])

      const successRate = totalRequests > 0 ? (totalDonations / totalRequests) * 100 : 0
      const avgResponseTime = await this.getAverageResponseTime()

      return {
        total_donors: totalDonors,
        total_requests: totalRequests,
        total_donations: totalDonations,
        success_rate: Math.round(successRate),
        avg_response_time: Math.round(avgResponseTime),
        blood_type_distribution: bloodTypeDistribution,
        location_heatmap: locationHeatmap,
        time_series_data: timeSeriesData,
        demand_forecast: demandForecast,
        efficiency_metrics: efficiencyMetrics
      }
    } catch (error: any) {
      console.error('Error getting analytics data:', error)
      return {
        total_donors: 0,
        total_requests: 0,
        total_donations: 0,
        success_rate: 0,
        avg_response_time: 0,
        blood_type_distribution: {},
        location_heatmap: [],
        time_series_data: [],
        demand_forecast: [],
        efficiency_metrics: {
          matching_efficiency: 0,
          response_efficiency: 0,
          completion_efficiency: 0
        }
      }
    }
  }

  /**
   * Get donor analytics for individual donors
   */
  async getDonorAnalytics(donorId: string): Promise<DonorAnalytics | null> {
    try {
      // Get donor's donation history
      const { data: donations } = await this.supabase
        .from('blood_requests')
        .select(`
          *,
          donor_responses!inner (
            response_type,
            created_at,
            eta_minutes
          )
        `)
        .eq('donor_responses.donor_id', donorId)

      if (!donations || donations.length === 0) return null

      // Get donor profile
      const { data: donor } = await this.supabase
        .from('users')
        .select('blood_type, location')
        .eq('id', donorId)
        .single()

      if (!donor) return null

      // Calculate metrics
      const totalDonations = donations.length
      const successfulDonations = donations.filter(d => d.status === 'completed').length
      const successRate = totalDonations > 0 ? (successfulDonations / totalDonations) * 100 : 0

      // Calculate average response time
      const responseTimes = donations
        .map(d => {
          const response = d.donor_responses?.[0]
          if (response) {
            const requestTime = new Date(d.created_at).getTime()
            const responseTime = new Date(response.created_at).getTime()
            return (responseTime - requestTime) / (1000 * 60) // Convert to minutes
          }
          return null
        })
        .filter(time => time !== null && time > 0)

      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum: number, time: number | null) => sum + (time || 0), 0) / responseTimes.length
        : 0

      // Analyze preferred times and locations
      const preferredTimes = this.analyzePreferredTimes(donations)
      const preferredLocations = this.analyzePreferredLocations(donations)

      // Calculate reliability score
      const reliabilityScore = this.calculateReliabilityScore(donations, avgResponseTime, successRate)

      return {
        donor_id: donorId,
        total_donations: totalDonations,
        avg_response_time: Math.round(avgResponseTime),
        success_rate: Math.round(successRate),
        preferred_times: preferredTimes,
        preferred_locations: preferredLocations,
        blood_type: donor.blood_type,
        reliability_score: reliabilityScore
      }
    } catch (error: any) {
      console.error('Error getting donor analytics:', error)
      return null
    }
  }

  /**
   * Get request analytics for individual requests
   */
  async getRequestAnalytics(requestId: string): Promise<RequestAnalytics | null> {
    try {
      const { data: request } = await this.supabase
        .from('blood_requests')
        .select(`
          *,
          donor_responses (
            response_type,
            created_at
          )
        `)
        .eq('id', requestId)
        .single()

      if (!request) return null

      // Calculate metrics
      const responseCount = request.donor_responses?.length || 0
      const timeToMatch = this.calculateTimeToMatch(request)
      const completionTime = this.calculateCompletionTime(request)
      const success = request.status === 'completed'

      return {
        request_id: requestId,
        blood_type: request.blood_type,
        urgency: request.emergency_level,
        response_count: responseCount,
        time_to_match: timeToMatch,
        completion_time: completionTime,
        location: request.location,
        success
      }
    } catch (error: any) {
      console.error('Error getting request analytics:', error)
      return null
    }
  }

  /**
   * Get total donors count
   */
  private async getTotalDonors(): Promise<number> {
    const { count } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('available', true)

    return count || 0
  }

  /**
   * Get total requests count
   */
  private async getTotalRequests(): Promise<number> {
    const { count } = await this.supabase
      .from('blood_requests')
      .select('*', { count: 'exact', head: true })

    return count || 0
  }

  /**
   * Get total donations count
   */
  private async getTotalDonations(): Promise<number> {
    const { count } = await this.supabase
      .from('blood_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    return count || 0
  }

  /**
   * Get blood type distribution
   */
  private async getBloodTypeDistribution(): Promise<Record<string, number>> {
    const { data: requests } = await this.supabase
      .from('blood_requests')
      .select('blood_type')

    const distribution: Record<string, number> = {}
    
    requests?.forEach(request => {
      distribution[request.blood_type] = (distribution[request.blood_type] || 0) + 1
    })

    return distribution
  }

  /**
   * Get location heatmap data
   */
  private async getLocationHeatmap(): Promise<Array<{ location: string; count: number; coordinates: [number, number] }>> {
    const { data: requests } = await this.supabase
      .from('blood_requests')
      .select('location, latitude, longitude')

    const locationMap = new Map<string, { count: number; coordinates: [number, number] }>()

    requests?.forEach(request => {
      const location = request.location
      const coordinates: [number, number] = [
        request.latitude || 0,
        request.longitude || 0
      ]

      if (locationMap.has(location)) {
        locationMap.get(location)!.count++
      } else {
        locationMap.set(location, { count: 1, coordinates })
      }
    })

    return Array.from(locationMap.entries()).map(([location, data]) => ({
      location,
      count: data.count,
      coordinates: data.coordinates
    }))
  }

  /**
   * Get time series data for trends
   */
  private async getTimeSeriesData(): Promise<Array<{ date: string; requests: number; donations: number }>> {
    const { data: requests } = await this.supabase
      .from('blood_requests')
      .select('created_at, status')
      .order('created_at', { ascending: true })

    const timeSeriesMap = new Map<string, { requests: number; donations: number }>()

    requests?.forEach(request => {
      const date = new Date(request.created_at).toISOString().split('T')[0]
      
      if (timeSeriesMap.has(date)) {
        timeSeriesMap.get(date)!.requests++
        if (request.status === 'completed') {
          timeSeriesMap.get(date)!.donations++
        }
      } else {
        timeSeriesMap.set(date, {
          requests: 1,
          donations: request.status === 'completed' ? 1 : 0
        })
      }
    })

    return Array.from(timeSeriesMap.entries()).map(([date, data]) => ({
      date,
      requests: data.requests,
      donations: data.donations
    }))
  }

  /**
   * Get demand forecast using simple linear regression
   */
  private async getDemandForecast(): Promise<Array<{ date: string; predicted_demand: number; confidence: number }>> {
    const timeSeriesData = await this.getTimeSeriesData()
    
    if (timeSeriesData.length < 7) {
      return []
    }

    // Simple linear regression for demand forecasting
    const xValues = timeSeriesData.map((_, index) => index)
    const yValues = timeSeriesData.map(d => d.requests)

    const { slope, intercept } = this.calculateLinearRegression(xValues, yValues)

    // Generate forecast for next 7 days
    const forecast = []
    const lastIndex = timeSeriesData.length - 1

    for (let i = 1; i <= 7; i++) {
      const predictedValue = slope * (lastIndex + i) + intercept
      const confidence = Math.max(0.5, 1 - (i * 0.1)) // Decreasing confidence over time

      forecast.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predicted_demand: Math.max(0, Math.round(predictedValue)),
        confidence: Math.round(confidence * 100)
      })
    }

    return forecast
  }

  /**
   * Get efficiency metrics
   */
  private async getEfficiencyMetrics(): Promise<{
    matching_efficiency: number
    response_efficiency: number
    completion_efficiency: number
  }> {
    const { data: requests } = await this.supabase
      .from('blood_requests')
      .select(`
        *,
        donor_responses (
          response_type,
          created_at
        )
      `)

    if (!requests || requests.length === 0) {
      return {
        matching_efficiency: 0,
        response_efficiency: 0,
        completion_efficiency: 0
      }
    }

    // Calculate matching efficiency (requests that got responses)
    const requestsWithResponses = requests.filter(r => (r.donor_responses?.length || 0) > 0)
    const matchingEfficiency = (requestsWithResponses.length / requests.length) * 100

    // Calculate response efficiency (average response time)
    const responseTimes = requests
      .map(r => {
        const firstResponse = r.donor_responses?.[0]
        if (firstResponse) {
          const requestTime = new Date(r.created_at).getTime()
          const responseTime = new Date(firstResponse.created_at).getTime()
          return (responseTime - requestTime) / (1000 * 60) // Convert to minutes
        }
        return null
      })
      .filter(time => time !== null && time > 0)

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum: number, time: number | null) => sum + (time || 0), 0) / responseTimes.length
      : 0

    // Response efficiency (inverse of response time, normalized)
    const responseEfficiency = Math.max(0, 100 - (avgResponseTime / 60) * 100)

    // Calculate completion efficiency (completed requests)
    const completedRequests = requests.filter(r => r.status === 'completed')
    const completionEfficiency = (completedRequests.length / requests.length) * 100

    return {
      matching_efficiency: Math.round(matchingEfficiency),
      response_efficiency: Math.round(responseEfficiency),
      completion_efficiency: Math.round(completionEfficiency)
    }
  }

  /**
   * Get average response time
   */
  private async getAverageResponseTime(): Promise<number> {
    const { data: responses } = await this.supabase
      .from('donor_responses')
      .select('created_at')

    if (!responses || responses.length === 0) return 0

    // Calculate average time from request to response
    const responseTimes = responses
      .map(response => {
        // This is a simplified calculation
        // In a real implementation, you'd need to join with requests table
        return 30 // Default 30 minutes for demo
      })

    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
  }

  /**
   * Analyze preferred times for donations
   */
  private analyzePreferredTimes(donations: any[]): string[] {
    const timeSlots = new Map<string, number>()

    donations.forEach(donation => {
      const hour = new Date(donation.created_at).getHours()
      let timeSlot: string

      if (hour >= 6 && hour < 12) timeSlot = 'Morning (6-12)'
      else if (hour >= 12 && hour < 18) timeSlot = 'Afternoon (12-18)'
      else if (hour >= 18 && hour < 24) timeSlot = 'Evening (18-24)'
      else timeSlot = 'Night (0-6)'

      timeSlots.set(timeSlot, (timeSlots.get(timeSlot) || 0) + 1)
    })

    return Array.from(timeSlots.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([timeSlot]) => timeSlot)
  }

  /**
   * Analyze preferred locations for donations
   */
  private analyzePreferredLocations(donations: any[]): string[] {
    const locationCount = new Map<string, number>()

    donations.forEach(donation => {
      const location = donation.location
      locationCount.set(location, (locationCount.get(location) || 0) + 1)
    })

    return Array.from(locationCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([location]) => location)
  }

  /**
   * Calculate reliability score for a donor
   */
  private calculateReliabilityScore(donations: any[], avgResponseTime: number, successRate: number): number {
    let score = 50 // Base score

    // Response time factor (faster = higher score)
    if (avgResponseTime < 15) score += 25
    else if (avgResponseTime < 30) score += 15
    else if (avgResponseTime < 60) score += 5

    // Success rate factor
    score += successRate * 0.25

    // Consistency factor (more donations = higher score)
    if (donations.length >= 10) score += 20
    else if (donations.length >= 5) score += 10
    else if (donations.length >= 2) score += 5

    return Math.min(score, 100)
  }

  /**
   * Calculate time to match for a request
   */
  private calculateTimeToMatch(request: any): number {
    const firstAcceptance = request.donor_responses?.find((r: any) => r.response_type === 'accept')
    
    if (!firstAcceptance) return -1 // No match

    const requestTime = new Date(request.created_at).getTime()
    const matchTime = new Date(firstAcceptance.created_at).getTime()
    
    return (matchTime - requestTime) / (1000 * 60) // Convert to minutes
  }

  /**
   * Calculate completion time for a request
   */
  private calculateCompletionTime(request: any): number {
    if (request.status !== 'completed') return -1

    const requestTime = new Date(request.created_at).getTime()
    const completionTime = new Date(request.updated_at).getTime()
    
    return (completionTime - requestTime) / (1000 * 60) // Convert to minutes
  }

  /**
   * Calculate linear regression for forecasting
   */
  private calculateLinearRegression(xValues: number[], yValues: number[]): { slope: number; intercept: number } {
    const n = xValues.length
    const sumX = xValues.reduce((sum, x) => sum + x, 0)
    const sumY = yValues.reduce((sum, y) => sum + y, 0)
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return { slope, intercept }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService() 