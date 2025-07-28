"use client"

import { useI18n } from "@/lib/i18n/client"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Bell, Check, Trash2, Settings, AlertCircle, Heart, Gift } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getUserNotifications, markNotificationAsRead } from "@/app/actions/notification-actions"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  title: string
  message: string
  notification_type: "blood_request" | "donor_match" | "emergency" | "reminder"
  status: "pending" | "sent" | "failed" | "delivered"
  created_at: string
  data?: any
}

export default function NotificationsPage() {
  const t = useI18n()
  const params = useParams()
  const locale = params.locale as string
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    requestNotifications: true,
    reminderNotifications: true,
    systemNotifications: false
  })

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const result = await getUserNotifications(user!.id)
      if (result.success && 'data' in result && result.data) {
        setNotifications(result.data)
      } else {
        toast({
          title: "Error",
          description: 'error' in result ? result.error : "Failed to load notifications",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const result = await markNotificationAsRead(id)
      if (result.success) {
        setNotifications(notifications.map(notification =>
          notification.id === id ? { ...notification, status: 'delivered' } : notification
        ))
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to mark notification as read",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((notification: Notification) => notification.id !== id))
  }

  const getNotificationIcon = (type: Notification["notification_type"]) => {
    switch (type) {
      case "blood_request":
        return <Bell className="h-5 w-5 text-red-500" />
      case "donor_match":
        return <Heart className="h-5 w-5 text-green-500" />
      case "emergency":
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case "reminder":
        return <Gift className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const isUnread = (notification: Notification) => {
    return notification.status === 'pending' || notification.status === 'sent'
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
              {loading ? (
                <div className="text-center py-8">
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No notifications found</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <Card key={notification.id} className={cn(
                    "transition-colors",
                    isUnread(notification) && "bg-muted/50"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          {getNotificationIcon(notification.notification_type)}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{notification.title}</h3>
                              {isUnread(notification) && (
                                <Badge variant="secondary">New</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {isUnread(notification) && (
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
                ))
              )}
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