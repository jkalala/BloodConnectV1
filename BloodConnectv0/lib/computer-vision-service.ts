/**
 * Computer Vision Service for BloodConnect
 * Provides blood type recognition via camera/image analysis
 */

import { performanceMonitor } from './performance-monitoring'
import { getSupabase } from './supabase'

export interface BloodTypeRecognitionResult {
  bloodType: string
  confidence: number
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  processingTime: number
  imageId?: string
}

export interface ImageAnalysisResult {
  isBloodTypeCard: boolean
  detectedText: string[]
  bloodTypeResults: BloodTypeRecognitionResult[]
  quality: 'high' | 'medium' | 'low'
  recommendations: string[]
}

export class ComputerVisionService {
  private supabase = getSupabase()
  private modelLoaded = false
  private supportedBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

  constructor() {
    this.initializeModels()
  }

  /**
   * Initialize computer vision models
   */
  private async initializeModels(): Promise<void> {
    try {
      console.log('🔍 Initializing computer vision models...')
      
      // In a real implementation, this would load actual ML models
      // For now, we'll simulate model loading
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      this.modelLoaded = true
      console.log('✅ Computer vision models loaded successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize CV models:', error)
      this.modelLoaded = false
    }
  }

  /**
   * Analyze image for blood type recognition
   */
  async analyzeBloodTypeImage(
    imageFile: File | string,
    userId?: string
  ): Promise<ImageAnalysisResult> {
    const tracker = performanceMonitor.startTracking('computer-vision', 'ANALYZE_IMAGE')
    
    try {
      if (!this.modelLoaded) {
        throw new Error('Computer vision models not loaded')
      }

      console.log('🔍 Analyzing image for blood type recognition...')
      
      // Convert image to processable format
      const imageData = await this.preprocessImage(imageFile)
      
      // Detect if image contains blood type information
      const isBloodTypeCard = await this.detectBloodTypeCard(imageData)
      
      if (!isBloodTypeCard) {
        return {
          isBloodTypeCard: false,
          detectedText: [],
          bloodTypeResults: [],
          quality: 'low',
          recommendations: [
            'Image does not appear to contain blood type information',
            'Please ensure the image shows a blood donor card or medical document',
            'Make sure text is clearly visible and well-lit'
          ]
        }
      }

      // Extract text from image
      const detectedText = await this.performOCR(imageData)
      
      // Recognize blood types from extracted text
      const bloodTypeResults = await this.recognizeBloodTypes(detectedText, imageData)
      
      // Assess image quality
      const quality = this.assessImageQuality(imageData, detectedText)
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(quality, bloodTypeResults)
      
      // Store analysis result if user provided
      if (userId && bloodTypeResults.length > 0) {
        await this.storeAnalysisResult(userId, bloodTypeResults[0], imageData)
      }
      
      console.log(`✅ Image analysis completed: ${bloodTypeResults.length} blood types detected`)
      tracker.end(200)
      
      return {
        isBloodTypeCard,
        detectedText,
        bloodTypeResults,
        quality,
        recommendations
      }

    } catch (error: any) {
      console.error('❌ Image analysis failed:', error)
      tracker.end(500)
      
      return {
        isBloodTypeCard: false,
        detectedText: [],
        bloodTypeResults: [],
        quality: 'low',
        recommendations: [
          'Image analysis failed. Please try again with a clearer image.',
          'Ensure good lighting and focus when taking the photo.'
        ]
      }
    }
  }

  /**
   * Real-time blood type recognition from camera stream
   */
  async startRealTimeRecognition(
    videoElement: HTMLVideoElement,
    onDetection: (result: BloodTypeRecognitionResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      if (!this.modelLoaded) {
        throw new Error('Computer vision models not loaded')
      }

      console.log('📹 Starting real-time blood type recognition...')
      
      // Get camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use rear camera on mobile
        }
      })
      
      videoElement.srcObject = stream
      
      // Process frames for blood type detection
      const processFrame = async () => {
        if (videoElement.paused || videoElement.ended) {
          return
        }
        
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          canvas.width = videoElement.videoWidth
          canvas.height = videoElement.videoHeight
          
          ctx?.drawImage(videoElement, 0, 0)
          
          // Convert to image data for processing
          const imageData = canvas.toDataURL('image/jpeg', 0.8)
          
          // Quick blood type detection
          const result = await this.quickBloodTypeDetection(imageData)
          
          if (result && result.confidence > 0.7) {
            onDetection(result)
          }
          
        } catch (error) {
          console.error('Frame processing error:', error)
        }
        
        // Continue processing next frame
        requestAnimationFrame(processFrame)
      }
      
      videoElement.addEventListener('loadedmetadata', () => {
        processFrame()
      })
      
    } catch (error: any) {
      console.error('❌ Real-time recognition failed:', error)
      onError(error.message)
    }
  }

  /**
   * Validate blood type against image analysis
   */
  async validateBloodType(
    claimedBloodType: string,
    imageFile: File
  ): Promise<{
    isValid: boolean
    confidence: number
    detectedBloodType?: string
    discrepancy?: string
  }> {
    try {
      const analysis = await this.analyzeBloodTypeImage(imageFile)
      
      if (analysis.bloodTypeResults.length === 0) {
        return {
          isValid: false,
          confidence: 0,
          discrepancy: 'No blood type detected in image'
        }
      }
      
      const detectedResult = analysis.bloodTypeResults[0]
      const isValid = detectedResult.bloodType === claimedBloodType
      
      return {
        isValid,
        confidence: detectedResult.confidence,
        detectedBloodType: detectedResult.bloodType,
        discrepancy: isValid ? undefined : `Claimed: ${claimedBloodType}, Detected: ${detectedResult.bloodType}`
      }
      
    } catch (error) {
      console.error('Blood type validation error:', error)
      return {
        isValid: false,
        confidence: 0,
        discrepancy: 'Validation failed due to processing error'
      }
    }
  }

  /**
   * Preprocess image for analysis
   */
  private async preprocessImage(imageFile: File | string): Promise<string> {
    if (typeof imageFile === 'string') {
      return imageFile
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        const result = event.target?.result as string
        resolve(result)
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read image file'))
      }
      
      reader.readAsDataURL(imageFile)
    })
  }

  /**
   * Detect if image contains blood type card
   */
  private async detectBloodTypeCard(imageData: string): Promise<boolean> {
    // Simulate blood type card detection
    // In real implementation, this would use computer vision to detect
    // donor cards, medical documents, or blood type indicators
    
    const hasBloodTypeKeywords = this.hasBloodTypeKeywords(imageData)
    const hasCardLikeStructure = this.hasCardLikeStructure(imageData)
    
    return hasBloodTypeKeywords || hasCardLikeStructure
  }

  /**
   * Perform OCR on image
   */
  private async performOCR(imageData: string): Promise<string[]> {
    // Simulate OCR text extraction
    // In real implementation, this would use Tesseract.js or cloud OCR service
    
    const simulatedText = [
      'BLOOD DONOR CARD',
      'Blood Type: A+',
      'Donor ID: 12345',
      'Name: John Doe',
      'Emergency Contact: +254123456789'
    ]
    
    return simulatedText
  }

  /**
   * Recognize blood types from extracted text
   */
  private async recognizeBloodTypes(
    detectedText: string[], 
    imageData: string
  ): Promise<BloodTypeRecognitionResult[]> {
    const results: BloodTypeRecognitionResult[] = []
    const startTime = Date.now()
    
    for (const text of detectedText) {
      for (const bloodType of this.supportedBloodTypes) {
        if (text.toUpperCase().includes(bloodType)) {
          results.push({
            bloodType,
            confidence: 0.85 + Math.random() * 0.1, // Simulate confidence
            boundingBox: {
              x: Math.random() * 100,
              y: Math.random() * 100,
              width: 50 + Math.random() * 50,
              height: 20 + Math.random() * 20
            },
            processingTime: Date.now() - startTime
          })
          break // Only detect one blood type per text line
        }
      }
    }
    
    return results
  }

  /**
   * Quick blood type detection for real-time processing
   */
  private async quickBloodTypeDetection(imageData: string): Promise<BloodTypeRecognitionResult | null> {
    // Simulate quick detection for real-time processing
    const hasBloodType = Math.random() > 0.7 // 30% chance of detection
    
    if (!hasBloodType) return null
    
    const randomBloodType = this.supportedBloodTypes[
      Math.floor(Math.random() * this.supportedBloodTypes.length)
    ]
    
    return {
      bloodType: randomBloodType,
      confidence: 0.6 + Math.random() * 0.3,
      processingTime: 50 + Math.random() * 100
    }
  }

  /**
   * Assess image quality
   */
  private assessImageQuality(imageData: string, detectedText: string[]): 'high' | 'medium' | 'low' {
    // Simulate quality assessment based on text detection success
    if (detectedText.length >= 4) return 'high'
    if (detectedText.length >= 2) return 'medium'
    return 'low'
  }

  /**
   * Generate recommendations for better image capture
   */
  private generateRecommendations(
    quality: 'high' | 'medium' | 'low',
    results: BloodTypeRecognitionResult[]
  ): string[] {
    const recommendations: string[] = []
    
    if (quality === 'low') {
      recommendations.push('Improve lighting conditions')
      recommendations.push('Hold camera steady and focus on the document')
      recommendations.push('Ensure the blood type card fills most of the frame')
    }
    
    if (results.length === 0) {
      recommendations.push('Make sure blood type information is clearly visible')
      recommendations.push('Try a different angle or distance')
    }
    
    if (results.some(r => r.confidence < 0.7)) {
      recommendations.push('Clean the camera lens')
      recommendations.push('Avoid shadows and reflections')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Image quality is good - blood type detected successfully')
    }
    
    return recommendations
  }

  /**
   * Helper method to detect blood type keywords
   */
  private hasBloodTypeKeywords(imageData: string): boolean {
    const keywords = ['blood', 'type', 'donor', 'card', 'medical']
    return keywords.some(keyword => 
      imageData.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  /**
   * Helper method to detect card-like structure
   */
  private hasCardLikeStructure(imageData: string): boolean {
    // Simulate detection of card-like structure
    // In real implementation, this would analyze image geometry
    return Math.random() > 0.5
  }

  /**
   * Store analysis result in database
   */
  private async storeAnalysisResult(
    userId: string,
    result: BloodTypeRecognitionResult,
    imageData: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('blood_type_verifications')
        .insert({
          user_id: userId,
          detected_blood_type: result.bloodType,
          confidence: result.confidence,
          processing_time: result.processingTime,
          image_hash: this.generateImageHash(imageData),
          verification_status: result.confidence > 0.8 ? 'verified' : 'needs_review',
          created_at: new Date().toISOString()
        })
        
      console.log('✅ Blood type verification stored')
      
    } catch (error) {
      console.error('❌ Failed to store verification:', error)
    }
  }

  /**
   * Generate hash for image data (for privacy)
   */
  private generateImageHash(imageData: string): string {
    // Simple hash implementation - in production use proper crypto
    let hash = 0
    for (let i = 0; i < imageData.length; i++) {
      const char = imageData.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(16)
  }

  /**
   * Get computer vision service statistics
   */
  async getServiceStats(): Promise<{
    totalAnalyses: number
    successRate: number
    averageConfidence: number
    topBloodTypes: { bloodType: string; count: number }[]
  }> {
    try {
      const { data: verifications } = await this.supabase
        .from('blood_type_verifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      const totalAnalyses = verifications?.length || 0
      const successful = verifications?.filter(v => v.verification_status === 'verified').length || 0
      const successRate = totalAnalyses > 0 ? successful / totalAnalyses : 0
      
      const averageConfidence = verifications?.length 
        ? verifications.reduce((sum, v) => sum + v.confidence, 0) / verifications.length
        : 0

      const bloodTypeCounts: Record<string, number> = {}
      verifications?.forEach(v => {
        bloodTypeCounts[v.detected_blood_type] = (bloodTypeCounts[v.detected_blood_type] || 0) + 1
      })

      const topBloodTypes = Object.entries(bloodTypeCounts)
        .map(([bloodType, count]) => ({ bloodType, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        totalAnalyses,
        successRate,
        averageConfidence,
        topBloodTypes
      }

    } catch (error) {
      console.error('Error getting service stats:', error)
      return {
        totalAnalyses: 0,
        successRate: 0,
        averageConfidence: 0,
        topBloodTypes: []
      }
    }
  }

  /**
   * Health check for computer vision service
   */
  healthCheck(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    modelLoaded: boolean
    issues: string[]
  } {
    const issues: string[] = []
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    if (!this.modelLoaded) {
      issues.push('Computer vision models not loaded')
      status = 'unhealthy'
    }

    return {
      status,
      modelLoaded: this.modelLoaded,
      issues
    }
  }
}

// Export singleton instance
export const computerVisionService = new ComputerVisionService()