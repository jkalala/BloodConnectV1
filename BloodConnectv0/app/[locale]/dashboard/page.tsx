"use client"

import { useAuth } from "@/contexts/auth-context"
import { useI18n } from "@/lib/i18n/client"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Map, Bell, Calendar } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function DashboardPage() {
  const { user } = useAuth()
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
              <h1 className="text-2xl font-bold">{t("dashboard.welcome")}, {user?.user_metadata?.name || t("dashboard.donor")}</h1>
              <p className="text-muted-foreground">{t("dashboard.quickActions")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Map className="h-5 w-5 mr-2" />
                  {t("dashboard.findDonors")}
                </CardTitle>
                <CardDescription>{t("dashboard.findDonorsDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`/${locale}/map`}>
                    {t("dashboard.viewMap")}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  {t("dashboard.bloodRequests")}
                </CardTitle>
                <CardDescription>{t("dashboard.bloodRequestsDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`/${locale}/requests`}>
                    {t("dashboard.viewRequests")}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {t("dashboard.donationHistory")}
                </CardTitle>
                <CardDescription>{t("dashboard.donationHistoryDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`/${locale}/history`}>
                    {t("dashboard.viewHistory")}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  {t("dashboard.profile")}
                </CardTitle>
                <CardDescription>{t("dashboard.profileDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`/${locale}/profile`}>
                    {t("dashboard.viewProfile")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
} 