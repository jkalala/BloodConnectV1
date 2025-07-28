"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"
import { 
  Home, 
  Map, 
  Heart, 
  User, 
  Bell, 
  History, 
  Calendar,
  Settings,
  Activity,
  MessageSquare,
  Smartphone,
  Globe
} from "lucide-react"

export function MobileNav() {
  const t = useI18n()
  const pathname = usePathname()

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Real-time Dashboard",
      href: "/real-time-dashboard",
      icon: Activity,
    },
    {
      name: "Map",
      href: "/map",
      icon: Map,
    },
    {
      name: "Request",
      href: "/request",
      icon: Heart,
    },
    {
      name: "Requests",
      href: "/requests",
      icon: Bell,
    },
    {
      name: "Schedule",
      href: "/schedule",
      icon: Calendar,
    },
    {
      name: "History",
      href: "/history",
      icon: History,
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
    },
    {
      name: "WhatsApp",
      href: "/whatsapp",
      icon: MessageSquare,
    },
    {
      name: "USSD",
      href: "/ussd",
      icon: Smartphone,
    },
    {
      name: "Offline Maps",
      href: "/offline-maps",
      icon: Globe,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex justify-around">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 text-xs transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-center leading-none">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
