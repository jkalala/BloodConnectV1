'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'

// TypeScript declarations for Google Maps
declare global {
  interface Window {
    google: any
    initGoogleMapsCallback: () => void
  }
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MapPin, 
  Navigation, 
  Users, 
  Droplet, 
  Clock, 
  AlertTriangle,
  Zap,
  RefreshCw,
  Target,
  Route,
  Eye,
  EyeOff
} from 'lucide-react'

interface LocationCoordinates {
  lat: number
  lng: number
}

interface DonorMarker {
  id: string
  name: string
  bloodType: string
  coordinates: LocationCoordinates
  status: 'available' | 'unavailable' | 'traveling' | 'donating'
  distance: number
  estimatedArrival: string
  responseRate: number
  verified: boolean
}

interface BloodRequestMarker {
  id: string
  patientName: string
  bloodType: string
  urgency: 'normal' | 'urgent' | 'critical'
  coordinates: LocationCoordinates
  hospital: string
  unitsNeeded: number
  status: string
  createdAt: string
  matchedDonors: string[]
}

interface BloodBankMarker {
  id: string
  name: string
  coordinates: LocationCoordinates
  address: string
  isActive: boolean
  distance: number
  inventory: Record<string, number>
}

interface MapProps {
  center?: LocationCoordinates
  zoom?: number
  showDonors?: boolean
  showRequests?: boolean
  showBloodBanks?: boolean
  showTraffic?: boolean
  showRoutes?: boolean
  currentUserId?: string
  requestId?: string
  className?: string
}

export function EnhancedMap({
  center = { lat: -1.2921, lng: 36.8219 }, // Nairobi
  zoom = 12,
  showDonors = true,
  showRequests = true,
  showBloodBanks = true,
  showTraffic = false,
  showRoutes = false,
  currentUserId,
  requestId,
  className = ''
}: MapProps) {
  console.log("🎯 EnhancedMap component mounting...", { center, zoom, className })
  
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapContainerReady, setMapContainerReady] = useState(false)
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null)
  const [donors, setDonors] = useState<DonorMarker[]>([])
  const [requests, setRequests] = useState<BloodRequestMarker[]>([])
  const [bloodBanks, setBloodBanks] = useState<BloodBankMarker[]>([])
  const [selectedMarker, setSelectedMarker] = useState<any>(null)
  const [trackingEnabled, setTrackingEnabled] = useState(false)
  const [routeDisplayed, setRouteDisplayed] = useState<string | null>(null)

  // Callback ref to detect when the map container is ready
  const mapCallbackRef = useCallback((node: HTMLDivElement | null) => {
    console.log("🎯 Map callback ref called", { node: !!node })
    if (node) {
      mapRef.current = node
      setMapContainerReady(true)
    }
  }, [])

  // Initialize map when container is ready
  useEffect(() => {
    console.log("🚀 EnhancedMap useEffect triggered", { mapContainerReady, center, zoom })
    
    if (!mapContainerReady) {
      console.log("❌ Map container not ready yet")
      return
    }

    const initMap = async () => {
      try {
        console.log("🔄 Setting loading state and clearing errors")
        setLoading(true)
        setError(null)

        console.log("✅ Map container ready, starting initialization")
        console.log("📡 About to load Google Maps API...")
        
        // Load Google Maps API
        await loadGoogleMapsAPI()

      } catch (err) {
        console.error("❌ Error in initMap:", err)
        setError('Failed to initialize map')
        setLoading(false)
      }
    }

    console.log("🎬 Calling initMap function")
    initMap()
  }, [mapContainerReady, center, zoom])

  // Load Google Maps API
  const loadGoogleMapsAPI = async () => {
    const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyD70d12Z53Ah6diehNl4PBCO3VwljXlrsw"
    
    console.log("🗺️ Starting Google Maps API loading...")
    console.log("🔑 API Key:", GOOGLE_MAPS_API_KEY ? GOOGLE_MAPS_API_KEY.substring(0, 20) + "..." : "NOT_FOUND")
    
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key is not configured")
    }

    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      console.log("✅ Google Maps API already loaded")
      initializeGoogleMap()
      return
    }

    console.log("📡 Loading Google Maps API script...")

    // Load Google Maps API script
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&callback=initGoogleMapsCallback`
      script.async = true
      script.defer = true
      
      console.log("📍 Script URL:", script.src)
      
      // Create global callback function
      window.initGoogleMapsCallback = () => {
        try {
          console.log("🎯 Google Maps API callback triggered")
          initializeGoogleMap()
          resolve()
        } catch (err) {
          console.error("❌ Error initializing map:", err)
          setError("Failed to initialize Google Maps")
          setLoading(false)
          reject(err)
        }
      }
      
      script.onload = () => {
        console.log("✅ Google Maps script loaded successfully")
      }
      
      script.onerror = (event) => {
        console.error("❌ Failed to load Google Maps script:", event)
        console.error("❌ This could be due to:")
        console.error("   - Invalid API key")
        console.error("   - API key restrictions")
        console.error("   - Network connectivity issues")
        console.error("   - API quotas exceeded")
        setError("Failed to load Google Maps API. Please check your internet connection and API key.")
        setLoading(false)
        reject(new Error("Failed to load Google Maps API"))
      }
      
      // Add timeout to detect hanging script loads
      setTimeout(() => {
        if (!window.google || !window.google.maps) {
          console.warn("⚠️ Google Maps API taking longer than expected to load...")
          console.warn("⚠️ Checking for errors in Network tab or API key issues")
        }
      }, 10000) // 10 seconds timeout
      
      document.head.appendChild(script)
      console.log("📝 Script added to document head")
    })
  }

  // Initialize Google Map
  const initializeGoogleMap = async () => {
    console.log("🚀 Initializing Google Map...")
    console.log("📍 Map ref:", mapRef.current ? "✅ Available" : "❌ Not found")
    console.log("🌍 Google API:", window.google ? "✅ Available" : "❌ Not found")
    console.log("🗺️ Google Maps:", window.google?.maps ? "✅ Available" : "❌ Not found")
    console.log("📊 Center coordinates:", center)
    console.log("🔍 Zoom level:", zoom)
    
    if (!mapRef.current || !window.google || !window.google.maps) {
      console.error("❌ Google Maps API not available")
      setError("Google Maps API not available")
      setLoading(false)
      return
    }

    try {
      console.log("🎯 Creating Google Map instance...")
      // Initialize Google Map
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ],
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: true,
        rotateControl: true,
        fullscreenControl: true
      })

      console.log("✅ Google Map created successfully:", googleMap)
      setMap(googleMap)
      setLoading(false)

      // Load initial data
      console.log("📊 Loading initial map data...")
      await loadMapData()

    } catch (err) {
      console.error("❌ Error initializing Google Map:", err)
      setError(`Failed to initialize Google Map: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setLoading(false)
    }
  }

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLocation(location)
        },
        (error) => {
          console.warn('Could not get user location:', error)
        }
      )
    }
  }, [])

  // Real-time updates
  useEffect(() => {
    if (!map) return

    const interval = setInterval(async () => {
      if (trackingEnabled) {
        await loadMapData()
      }
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [map, trackingEnabled])

  const loadMapData = async () => {
    try {
      setLoading(true)

      const promises = []

      if (showDonors) {
        promises.push(loadNearbyDonors())
      }

      if (showRequests) {
        promises.push(loadBloodRequests())
      }

      if (showBloodBanks) {
        promises.push(loadBloodBanks())
      }

      await Promise.all(promises)

    } catch (err) {
      setError('Failed to load map data')
    } finally {
      setLoading(false)
    }
  }

  const loadNearbyDonors = async () => {
    try {
      // Mock API call - replace with actual endpoint
      const response = await fetch('/api/location/nearby-donors?' + new URLSearchParams({
        lat: center.lat.toString(),
        lng: center.lng.toString(),
        radius: '10'
      }))

      if (response.ok) {
        const data = await response.json()
        setDonors(data.donors || [])
      }
    } catch (error) {
      console.error('Error loading donors:', error)
    }
  }

  const loadBloodRequests = async () => {
    try {
      const response = await fetch('/api/location/blood-requests?' + new URLSearchParams({
        lat: center.lat.toString(),
        lng: center.lng.toString(),
        radius: '20'
      }))

      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error loading requests:', error)
    }
  }

  const loadBloodBanks = async () => {
    try {
      const response = await fetch('/api/location/blood-banks?' + new URLSearchParams({
        lat: center.lat.toString(),
        lng: center.lng.toString(),
        radius: '25'
      }))

      if (response.ok) {
        const data = await response.json()
        setBloodBanks(data.bloodBanks || [])
      }
    } catch (error) {
      console.error('Error loading blood banks:', error)
    }
  }

  const startLocationTracking = async () => {
    if (!currentUserId) return

    try {
      const response = await fetch('/api/location/tracking/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          type: 'donor',
          requestId,
          highAccuracy: true,
          updateInterval: 30000
        })
      })

      if (response.ok) {
        setTrackingEnabled(true)
      }
    } catch (error) {
      console.error('Error starting tracking:', error)
    }
  }

  const stopLocationTracking = async () => {
    // Implementation would stop tracking
    setTrackingEnabled(false)
  }

  const showRoute = async (donorId: string, requestId: string) => {
    try {
      const response = await fetch('/api/location/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donorId, requestId })
      })

      if (response.ok) {
        const routeData = await response.json()
        setRouteDisplayed(`${donorId}-${requestId}`)
        
        // In real implementation, would draw route on map
        console.log('Route data:', routeData)
      }
    } catch (error) {
      console.error('Error showing route:', error)
    }
  }

  const hideRoute = () => {
    setRouteDisplayed(null)
    // Remove route from map
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500'
      case 'urgent': return 'bg-orange-500'
      case 'normal': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'traveling': return 'bg-yellow-500'
      case 'donating': return 'bg-blue-500'
      case 'unavailable': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`
    }
    return `${distance.toFixed(1)}km`
  }

  const formatTime = (timeString: string) => {
    const time = new Date(timeString)
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Handle error state with overlay instead of early return
  const errorOverlay = error && (
    <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => {
            setError(null)
            setLoading(true)
            loadGoogleMapsAPI()
          }}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Loading Map
        </Button>
      </div>
    </div>
  )

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Real-time Blood Network Map</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMapData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {currentUserId && (
                <Button
                  variant={trackingEnabled ? "destructive" : "default"}
                  size="sm"
                  onClick={trackingEnabled ? stopLocationTracking : startLocationTracking}
                >
                  {trackingEnabled ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Stop Tracking
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Start Tracking
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            {showDonors && (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Donors ({donors.length})</span>
              </div>
            )}
            {showRequests && (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Requests ({requests.length})</span>
              </div>
            )}
            {showBloodBanks && (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Blood Banks ({bloodBanks.length})</span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Map Container */}
      <Card>
        <CardContent className="p-0">
          <div className="relative">
            {/* Google Maps Container */}
            <div 
              ref={mapCallbackRef}
              className="w-full h-96 rounded-lg overflow-hidden"
            />

            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                  <p>Loading Google Maps...</p>
                  <p className="text-xs text-muted-foreground">
                    API Key: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 
                      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.substring(0, 20) + "..." : "Not configured"}
                  </p>
                </div>
              </div>
            )}

            {/* Error overlay */}
            {errorOverlay}

            {/* Tracking indicator */}
            {trackingEnabled && (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                Live Tracking
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nearby Donors */}
        {showDonors && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Users className="h-4 w-4 mr-2 text-green-600" />
                Nearby Donors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {donors.slice(0, 5).map((donor) => (
                <div key={donor.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(donor.status)}`}></div>
                    <div>
                      <div className="font-medium text-sm">{donor.name}</div>
                      <div className="text-xs text-gray-500 flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {donor.bloodType}
                        </Badge>
                        <span>{formatDistance(donor.distance)}</span>
                        {donor.verified && (
                          <span className="text-green-600">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      ETA: {formatTime(donor.estimatedArrival)}
                    </div>
                    {requestId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-1 text-xs"
                        onClick={() => showRoute(donor.id, requestId)}
                      >
                        <Route className="h-3 w-3 mr-1" />
                        Route
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {donors.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No donors nearby</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Active Requests */}
        {showRequests && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Droplet className="h-4 w-4 mr-2 text-red-600" />
                Blood Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {requests.slice(0, 5).map((request) => (
                <div key={request.id} className="p-2 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getUrgencyColor(request.urgency)}`}></div>
                      <Badge variant="outline" className="text-xs">
                        {request.bloodType}
                      </Badge>
                      <Badge 
                        variant={request.urgency === 'critical' ? 'destructive' : 'default'}
                        className="text-xs"
                      >
                        {request.urgency}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {request.unitsNeeded} units
                    </div>
                  </div>
                  
                  <div className="text-sm font-medium">{request.hospital}</div>
                  <div className="text-xs text-gray-500 flex items-center justify-between">
                    <span>{formatTime(request.createdAt)}</span>
                    <span>{request.matchedDonors.length} matched</span>
                  </div>
                </div>
              ))}
              
              {requests.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <Droplet className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No active requests</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Blood Banks */}
        {showBloodBanks && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                Blood Banks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {bloodBanks.slice(0, 5).map((bank) => (
                <div key={bank.id} className="p-2 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{bank.name}</div>
                    <div className="text-xs text-gray-500">
                      {formatDistance(bank.distance)}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-2">
                    {bank.address}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(bank.inventory).map(([bloodType, count]) => (
                      <Badge 
                        key={bloodType} 
                        variant={count > 5 ? "default" : count > 0 ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {bloodType}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              
              {bloodBanks.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No blood banks nearby</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Route display indicator */}
      {routeDisplayed && (
        <Alert>
          <Route className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Route displayed on map</span>
            <Button
              variant="outline"
              size="sm"
              onClick={hideRoute}
            >
              Hide Route
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}