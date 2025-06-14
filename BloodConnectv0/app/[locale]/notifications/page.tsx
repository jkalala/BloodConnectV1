"use client"

import { useI18n } from "@/lib/i18n/client"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
import { useState } from "react"
import { Bell, Check, Trash2, Settings } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  message: string
  type: "request" | "reminder" | "system"
  read: boolean
  timestamp: string
}

export default function NotificationsPage() {
  const t = useI18n()
  const params = useParams()
  const locale = params.locale as string
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Blood Request",
      message: "Urgent need for O+ blood at Central Hospital",
      type: "request",
      read: false,
      timestamp: "2 hours ago"
    },
    {
      id: "2",
      title: "Donation Reminder",
      message: "You're eligible to donate blood again",
      type: "reminder",
      read: true,
      timestamp: "1 day ago"
    },
    {
      id: "3",
      title: "System Update",
      message: "New features available in the app",
      type: "system",
      read: false,
      timestamp: "3 days ago"
    }
  ])

  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    requestNotifications: true,
    reminderNotifications: true,
    systemNotifications: false
  })

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(notification => notification.id !== id))
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "request":
        return <Bell className="h-5 w-5 text-red-500" />
      case "reminder":
        return <Bell className="h-5 w-5 text-blue-500" />
      case "system":
        return <Settings className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-gray-800">
      <MobileNav />
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">Manage your notifications and preferences</p>
            </div>
          </div>

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {notifications.map((notification) => (
                <Card key={notification.id} className={cn(
                  "transition-colors",
                  !notification.read && "bg-muted/50"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        {getNotificationIcon(notification.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{notification.title}</h3>
                            {!notification.read && (
                              <Badge variant="secondary">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              {notifications
                .filter(n => n.type === "request")
                .map((notification) => (
                  <Card key={notification.id}>
                    {/* Same card content as above */}
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="reminders" className="space-y-4">
              {notifications
                .filter(n => n.type === "reminder")
                .map((notification) => (
                  <Card key={notification.id}>
                    {/* Same card content as above */}
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push">Push Notifications</Label>
                    <Switch
                      id="push"
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, pushNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email">Email Notifications</Label>
                    <Switch
                      id="email"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, emailNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="requests">Blood Request Notifications</Label>
                    <Switch
                      id="requests"
                      checked={settings.requestNotifications}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, requestNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reminders">Donation Reminders</Label>
                    <Switch
                      id="reminders"
                      checked={settings.reminderNotifications}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, reminderNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="system">System Updates</Label>
                    <Switch
                      id="system"
                      checked={settings.systemNotifications}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, systemNotifications: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
} 