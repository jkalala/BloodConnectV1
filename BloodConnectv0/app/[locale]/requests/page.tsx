"use client"

import { useI18n } from "@/lib/i18n/client"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Droplet } from "lucide-react"

export default function RequestsPage() {
  const t = useI18n()
  const params = useParams()
  const locale = params.locale as string

  // This would typically come from an API call
  const bloodRequests = [
    {
      id: 1,
      bloodType: "O+",
      units: 2,
      hospital: "Central Hospital",
      location: "Downtown",
      urgency: "Urgent",
      timeAgo: "2 hours ago"
    },
    // Add more mock data as needed
  ]

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-gray-800">
      <MobileNav />
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t("dashboard.bloodRequests")}</h1>
              <p className="text-muted-foreground">{t("dashboard.bloodRequestsDesc")}</p>
            </div>
          </div>

          <div className="grid gap-4">
            {bloodRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Droplet className="h-5 w-5 text-red-500" />
                      {request.bloodType}
                    </CardTitle>
                    <Badge variant={request.urgency === "Urgent" ? "destructive" : "default"}>
                      {request.urgency}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {request.hospital}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {request.timeAgo}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {request.units} units needed
                    </p>
                    <Button>Respond to Request</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
} 