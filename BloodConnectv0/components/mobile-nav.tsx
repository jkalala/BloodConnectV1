"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Home, Map, Bell, Calendar, User, Award, BarChart, LogOut, Settings, FileText } from "lucide-react"

export function MobileNav() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <Link href="/" className="flex items-center space-x-2">
        <span className="font-bold text-xl">BloodLink</span>
      </Link>
      <div className="flex items-center space-x-2">
        <ThemeToggle />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="flex flex-col space-y-4 mt-8">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`flex items-center space-x-2 p-2 rounded-md ${
                      isActive("/dashboard") ? "bg-muted" : "hover:bg-muted"
                    }`}
                  >
                    <Home className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/map"
                    className={`flex items-center space-x-2 p-2 rounded-md ${
                      isActive("/map") ? "bg-muted" : "hover:bg-muted"
                    }`}
                  >
                    <Map className="h-5 w-5" />
                    <span>Map</span>
                  </Link>
                  <Link
                    href="/offline-maps"
                    className={`flex items-center space-x-2 p-2 rounded-md ${
                      isActive("/offline-maps") ? "bg-muted" : "hover:bg-muted"
                    }`}
                  >
                    <Map className="h-5 w-5" />
                    <span>Offline Maps</span>
                  </Link>
                  <Link
                    href="/schedule"
                    className={`flex items-center space-x-2 p-2 rounded-md ${
                      isActive("/schedule") ? "bg-muted" : "hover:bg-muted"
                    }`}
                  >
                    <Calendar className="h-5 w-5" />
                    <span>Schedule Donation</span>
                  </Link>
                  <Link
                    href="/request"
                    className={`flex items-center space-x-2 p-2 rounded-md ${
                      isActive("/request") ? "bg-muted" : "hover:bg-muted"
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                    <span>Request Blood</span>
                  </Link>
                  <Link
                    href="/push-notifications"
                    className={`flex items-center space-x-2 p-2 rounded-md ${
                      isActive("/push-notifications") ? "bg-muted" : "hover:bg-muted"
                    }`}
                  >
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </Link>
                  <Link
                    href="/profile"
                    className={`flex items-center space-x-2 p-2 rounded-md ${
                      isActive("/profile") ? "bg-muted" : "hover:bg-muted"
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    href="/rewards"
                    className={`flex items-center space-x-2 p-2 rounded-md ${
                      isActive("/rewards") ? "bg-muted" : "hover:bg-muted"
                    }`}
                  >
                    <Award className="h-5 w-5" />
                    <span>Rewards</span>
                  </Link>
                  <Link
                    href="/analytics"
                    className={`flex items-center space-x-2 p-2 rounded-md ${
                      isActive("/analytics") ? "bg-muted" : "hover:bg-muted"
                    }`}
                  >
                    <BarChart className="h-5 w-5" />
                    <span>Analytics</span>
                  </Link>
                  <div className="border-t my-2"></div>
                  <Button
                    variant="ghost"
                    className="flex items-center justify-start space-x-2 p-2 rounded-md hover:bg-muted"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    className={`flex items-center space-x-2 p-2 rounded-md ${
                      isActive("/") ? "bg-muted" : "hover:bg-muted"
                    }`}
                  >
                    <Home className="h-5 w-5" />
                    <span>Home</span>
                  </Link>
                  <Link
                    href="/login"
                    className={`flex items-center space-x-2 p-2 rounded-md ${
                      isActive("/login") ? "bg-muted" : "hover:bg-muted"
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span>Login</span>
                  </Link>
                  <Link
                    href="/register"
                    className={`flex items-center space-x-2 p-2 rounded-md ${
                      isActive("/register") ? "bg-muted" : "hover:bg-muted"
                    }`}
                  >
                    <Settings className="h-5 w-5" />
                    <span>Register</span>
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
