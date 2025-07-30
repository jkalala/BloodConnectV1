import { getSupabase } from "./supabase"
import { mlEngine } from "./ml-engine"
import { performanceMonitor } from "./performance-monitoring"

export interface AIMatchPrediction {
  donor_id: string
  recipient_id: string
  compatibility_score: number
  success_probability: number
  response_time_prediction: number
  factors: string[]
}

export interface DonorProfile {
  id: string
  blood_type: string
  location: string
  response_rate: number
  avg_response_time: number
  success_rate: number
  availability_pattern: string
  last_donation: string
  total_donations: number
}

export class AIMatchingService {
  private supabase = getSupabase()

  /**
   * AI-powered donor matching with machine learning
   */
  async findOptimalDonors(
    requestId: string,
    bloodType: string,
    urgency: string,
    location: string
  ): Promise<AIMatchPrediction[]> {
    const tracker = performanceMonitor.startTracking('ai-matching', 'FIND_DONORS')
    
    try {
      console.log(`🤖 Finding optimal donors for request ${requestId}`)
      
      // Get compatible donors
      const compatibleDonors = await this.getCompatibleDonors(bloodType, location)
      
      if (compatibleDonors.length === 0) {
        console.log('No compatible donors found')
        tracker.end(200)
        return []
      }

      // Use ML engine for predictions
      const predictions: AIMatchPrediction[] = []
      
      for (const donor of compatibleDonors) {
        // Get ML prediction
        const mlPrediction = await mlEngine.predictDonorMatch(donor.id, requestId)
        const successProbability = await mlEngine.predictSuccessProbability(donor.id, requestId)
        const responseTimePrediction = await mlEngine.predictResponseTime(donor.id, urgency)
        
        // Combine ML prediction with traditional factors
        const compatibilityScore = mlPrediction ? 
          Math.round(mlPrediction.prediction * 100) : 
          this.calculateBaseCompatibility(donor, urgency)
          
        const factors = mlPrediction ? 
          mlPrediction.importance.slice(0, 5).map(imp => imp.feature) :
          this.identifyFactors(donor, { factors: {} }, urgency)

        predictions.push({
          donor_id: donor.id,
          recipient_id: requestId,
          compatibility_score: compatibilityScore,
          success_probability: successProbability,
          response_time_prediction: responseTimePrediction,
          factors
        })

        // Store prediction for evaluation
        await this.storePrediction(mlPrediction, donor.id, requestId)
      }
      
      // Sort by combined ML score and success probability
      predictions.sort((a, b) => {
        const scoreA = (a.compatibility_score * 0.4) + (a.success_probability * 100 * 0.6)
        const scoreB = (b.compatibility_score * 0.4) + (b.success_probability * 100 * 0.6)
        return scoreB - scoreA
      })
      
      console.log(`✅ Found ${predictions.length} donor matches, returning top 10`)
      tracker.end(200)
      
      return predictions.slice(0, 10) // Return top 10 matches
    } catch (error: any) {
      console.error('❌ Error in AI matching:', error)
      tracker.end(500)
      return []
    }
  }

  /**
   * Get historical donation data for ML training
   */
  private async getHistoricalData() {
    const { data: requests } = await this.supabase
      .from('blood_requests')
      .select(`
        *,
        donor_responses (
          response_type,
          response_time,
          donor_id
        )
      `)
      .not('status', 'eq', 'pending')
      .order('created_at', { ascending: false })
      .limit(1000)

    return requests || []
  }

  /**
   * Get compatible donors with enhanced filtering
   */
  private async getCompatibleDonors(bloodType: string, location: string) {
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

    const { data: donors } = await this.supabase
      .from('users')
      .select(`
        id,
        name,
        blood_type,
        location,
        available,
        last_donation,
        total_donations,
        response_rate,
        avg_response_time,
        success_rate
      `)
      .in('blood_type', compatibleTypes)
      .eq('available', true)
      .eq('receive_alerts', true)

    return donors || []
  }

  /**
   * Apply machine learning scoring algorithm
   */
  private async applyMLScoring(
    donors: any[],
    requestId: string,
    urgency: string,
    historicalData: any[]
  ): Promise<AIMatchPrediction[]> {
    const predictions: AIMatchPrediction[] = []

    for (const donor of donors) {
      // Calculate base compatibility score
      let compatibilityScore = this.calculateBaseCompatibility(donor, urgency)
      
      // Apply ML factors
      const mlFactors = this.applyMLFactors(donor, historicalData, urgency)
      compatibilityScore *= mlFactors.scoreMultiplier
      
      // Predict success probability
      const successProbability = this.predictSuccessProbability(donor, historicalData)
      
      // Predict response time
      const responseTimePrediction = this.predictResponseTime(donor, urgency)
      
      // Identify contributing factors
      const factors = this.identifyFactors(donor, mlFactors, urgency)

      predictions.push({
        donor_id: donor.id,
        recipient_id: requestId,
        compatibility_score: Math.round(compatibilityScore),
        success_probability: successProbability,
        response_time_prediction: responseTimePrediction,
        factors
      })
    }

    return predictions
  }

  /**
   * Calculate base compatibility score
   */
  private calculateBaseCompatibility(donor: any, urgency: string): number {
    let score = 100

    // Blood type compatibility (already filtered)
    if (donor.blood_type) score += 50

    // Availability score
    if (donor.available) score += 30

    // Response rate bonus
    if (donor.response_rate > 0.8) score += 20
    else if (donor.response_rate > 0.6) score += 10

    // Success rate bonus
    if (donor.success_rate > 0.9) score += 25
    else if (donor.success_rate > 0.7) score += 15

    // Urgency adjustment
    if (urgency === 'critical') score *= 1.3
    else if (urgency === 'urgent') score *= 1.1

    return score
  }

  /**
   * Apply machine learning factors
   */
  private applyMLFactors(donor: any, historicalData: any[], urgency: string) {
    let scoreMultiplier = 1.0
    const factors: any = {}

    // Time-based patterns
    const timePattern = this.analyzeTimePattern(donor, historicalData)
    if (timePattern.isActiveNow) {
      scoreMultiplier *= 1.2
      factors.timePattern = 'Active now'
    }

    // Location-based patterns
    const locationPattern = this.analyzeLocationPattern(donor, historicalData)
    if (locationPattern.isNearby) {
      scoreMultiplier *= 1.15
      factors.locationPattern = 'Nearby donor'
    }

    // Historical success patterns
    const successPattern = this.analyzeSuccessPattern(donor, historicalData)
    if (successPattern.highSuccessRate) {
      scoreMultiplier *= 1.25
      factors.successPattern = 'High success rate'
    }

    // Urgency matching
    if (urgency === 'critical' && donor.avg_response_time < 10) {
      scoreMultiplier *= 1.3
      factors.urgencyMatch = 'Fast responder'
    }

    return { scoreMultiplier, factors }
  }

  /**
   * Analyze time-based response patterns
   */
  private analyzeTimePattern(donor: any, historicalData: any[]) {
    const donorResponses = historicalData
      .flatMap(req => req.donor_responses)
      .filter(resp => resp.donor_id === donor.id)

    const now = new Date()
    const hour = now.getHours()
    
    // Check if donor is typically active at this time
    const activeHours = donorResponses
      .map(resp => new Date(resp.created_at).getHours())
      .filter(h => h >= 6 && h <= 22) // Active during day

    const isActiveNow = activeHours.length > donorResponses.length * 0.6

    return { isActiveNow }
  }

  /**
   * Analyze location-based patterns
   */
  private analyzeLocationPattern(donor: any, historicalData: any[]) {
    // Simplified location analysis
    // In a real implementation, this would use geospatial analysis
    return { isNearby: true } // Assume nearby for now
  }

  /**
   * Analyze historical success patterns
   */
  private analyzeSuccessPattern(donor: any, historicalData: any[]) {
    const donorResponses = historicalData
      .flatMap(req => req.donor_responses)
      .filter(resp => resp.donor_id === donor.id)

    const successfulResponses = donorResponses
      .filter(resp => resp.response_type === 'accept')

    const highSuccessRate = successfulResponses.length / donorResponses.length > 0.7

    return { highSuccessRate }
  }

  /**
   * Predict success probability using ML
   */
  private predictSuccessProbability(donor: any, historicalData: any[]): number {
    let probability = 0.5 // Base probability

    // Factor in response rate
    if (donor.response_rate) {
      probability *= donor.response_rate
    }

    // Factor in success rate
    if (donor.success_rate) {
      probability *= donor.success_rate
    }

    // Factor in recent activity
    const recentActivity = this.getRecentActivity(donor, historicalData)
    if (recentActivity > 0.8) {
      probability *= 1.2
    }

    return Math.min(probability, 0.95) // Cap at 95%
  }

  /**
   * Predict response time
   */
  private predictResponseTime(donor: any, urgency: string): number {
    let baseTime = donor.avg_response_time || 30 // Default 30 minutes

    // Adjust for urgency
    if (urgency === 'critical') {
      baseTime *= 0.7 // 30% faster for critical
    } else if (urgency === 'urgent') {
      baseTime *= 0.85 // 15% faster for urgent
    }

    return Math.round(baseTime)
  }

  /**
   * Get recent activity level
   */
  private getRecentActivity(donor: any, historicalData: any[]): number {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentResponses = historicalData
      .flatMap(req => req.donor_responses)
      .filter(resp => 
        resp.donor_id === donor.id && 
        new Date(resp.created_at) > thirtyDaysAgo
      )

    return recentResponses.length / 30 // Normalize to daily average
  }

  /**
   * Identify contributing factors for the match
   */
  private identifyFactors(donor: any, mlFactors: any, urgency: string): string[] {
    const factors: string[] = []

    if (donor.response_rate > 0.8) factors.push('High response rate')
    if (donor.success_rate > 0.9) factors.push('High success rate')
    if (donor.avg_response_time < 15) factors.push('Fast responder')
    if (urgency === 'critical') factors.push('Critical urgency')
    if (mlFactors.factors.timePattern) factors.push(mlFactors.factors.timePattern)
    if (mlFactors.factors.locationPattern) factors.push(mlFactors.factors.locationPattern)
    if (mlFactors.factors.successPattern) factors.push(mlFactors.factors.successPattern)
    if (mlFactors.factors.urgencyMatch) factors.push(mlFactors.factors.urgencyMatch)

    return factors
  }

  /**
   * Update donor profile with ML insights
   */
  async updateDonorProfile(donorId: string): Promise<void> {
    try {
      const historicalData = await this.getHistoricalData()
      const donorResponses = historicalData
        .flatMap(req => req.donor_responses)
        .filter(resp => resp.donor_id === donorId)

      if (donorResponses.length === 0) return

      // Calculate metrics
      const responseRate = donorResponses.length / historicalData.length
      const avgResponseTime = this.calculateAverageResponseTime(donorResponses)
      const successRate = this.calculateSuccessRate(donorResponses)

      // Update donor profile
      await this.supabase
        .from('users')
        .update({
          response_rate: responseRate,
          avg_response_time: avgResponseTime,
          success_rate: successRate
        })
        .eq('id', donorId)

    } catch (error: any) {
      console.error('Error updating donor profile:', error)
    }
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(responses: any[]): number {
    const responseTimes = responses
      .map(resp => {
        const requestTime = new Date(resp.created_at).getTime()
        const responseTime = new Date(resp.updated_at || resp.created_at).getTime()
        return (responseTime - requestTime) / (1000 * 60) // Convert to minutes
      })
      .filter(time => time > 0)

    if (responseTimes.length === 0) return 30

    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
  }

  /**
   * Calculate success rate
   */
  private calculateSuccessRate(responses: any[]): number {
    const successful = responses.filter(resp => resp.response_type === 'accept').length
    return successful / responses.length
  }

  /**
   * Store ML prediction for evaluation
   */
  private async storePrediction(mlPrediction: any, donorId: string, requestId: string): Promise<void> {
    if (!mlPrediction) return

    try {
      await this.supabase
        .from('ml_predictions')
        .insert([{
          model_type: 'donor_matching',
          model_version: 1,
          donor_id: donorId,
          request_id: requestId,
          prediction_value: mlPrediction.prediction,
          confidence: mlPrediction.confidence,
          features: mlPrediction.importance,
          explanation: mlPrediction.explanation
        }])
    } catch (error) {
      console.error('Error storing ML prediction:', error)
    }
  }

  /**
   * Train ML models with latest data
   */
  async trainModels(): Promise<{ success: boolean; accuracy: Record<string, number> }> {
    try {
      console.log('🎓 Training ML models...')
      const result = await mlEngine.trainModels()
      console.log('✅ ML model training completed:', result.accuracy)
      return result
    } catch (error) {
      console.error('❌ ML model training failed:', error)
      return { success: false, accuracy: {} }
    }
  }

  /**
   * Get ML model performance metrics
   */
  getModelMetrics(): Record<string, any> {
    return mlEngine.getModelMetrics()
  }

  /**
   * Update all donor profiles with latest ML insights
   */
  async updateAllDonorProfiles(): Promise<void> {
    try {
      const { data: donors } = await this.supabase
        .from('users')
        .select('id')
        .not('blood_type', 'is', null)

      console.log(`🔄 Updating ${donors?.length || 0} donor profiles...`)

      for (const donor of donors || []) {
        await this.updateDonorProfile(donor.id)
      }

      console.log('✅ All donor profiles updated')
    } catch (error) {
      console.error('❌ Error updating donor profiles:', error)
    }
  }

  /**
   * Analyze matching performance and suggest improvements
   */
  async analyzeMatchingPerformance(): Promise<{
    totalPredictions: number
    averageAccuracy: number
    modelPerformance: Record<string, number>
    recommendations: string[]
  }> {
    try {
      const { data: predictions } = await this.supabase
        .from('ml_predictions')
        .select('*')
        .not('actual_outcome', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000)

      const totalPredictions = predictions?.length || 0
      const correctPredictions = predictions?.filter(p => p.prediction_accuracy === 1.0).length || 0
      const averageAccuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0

      const modelPerformance = mlEngine.getModelMetrics()
      
      const recommendations: string[] = []
      
      if (averageAccuracy < 0.7) {
        recommendations.push('Model accuracy is below 70%. Consider retraining with more data.')
      }
      
      if (totalPredictions < 100) {
        recommendations.push('Limited prediction history. Collect more data for better insights.')
      }

      return {
        totalPredictions,
        averageAccuracy,
        modelPerformance,
        recommendations
      }

    } catch (error) {
      console.error('Error analyzing matching performance:', error)
      return {
        totalPredictions: 0,
        averageAccuracy: 0,
        modelPerformance: {},
        recommendations: ['Error analyzing performance. Check system logs.']
      }
    }
  }
}

// Export singleton instance
export const aiMatchingService = new AIMatchingService() 