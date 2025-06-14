"use client"

import { useI18n } from "@/lib/i18n/client"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useParams } from "next/navigation"
import dynamic from "next/dynamic"

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full bg-muted animate-pulse rounded-lg" />
  ),
})

export default function MapPage() {
  const t = useI18n()
  const params = useParams()
  const locale = params.locale as string

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-gray-800">
      <MobileNav />
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t("dashboard.findDonors")}</h1>
              <p className="text-muted-foreground">{t("dashboard.findDonorsDesc")}</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Donor Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] w-full rounded-lg overflow-hidden">
                <MapComponent />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
} 