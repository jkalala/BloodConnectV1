"use client"

import { useI18n } from "@/lib/i18n/client"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function ProfilePage() {
  const t = useI18n()
  const params = useParams()
  const locale = params.locale as string
  const { user } = useAuth()

  const userProfile = {
    name: user?.user_metadata?.name || "Donor",
    email: user?.email || "email@example.com",
    bloodType: "O+",
    lastDonation: "2024-02-15",
    totalDonations: 5,
    phone: "+1234567890",
    address: "123 Main St, City"
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-gray-800">
      <MobileNav />
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t("dashboard.profile")}</h1>
              <p className="text-muted-foreground">{t("dashboard.profileDesc")}</p>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>{userProfile.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{userProfile.name}</CardTitle>
                    <CardDescription>{userProfile.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Blood Type</Label>
                      <Input value={userProfile.bloodType} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Donation</Label>
                      <Input value={userProfile.lastDonation} disabled />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={userProfile.phone} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input value={userProfile.address} />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Total Donations</p>
                      <p className="text-2xl font-bold">{userProfile.totalDonations}</p>
                    </div>
                    <Button>Update Profile</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
} 