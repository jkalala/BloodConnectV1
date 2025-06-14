"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/contexts/auth-context"
import { useI18n } from "@/lib/i18n/client"
import { Heart, Lock, Phone, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const { signIn } = useAuth()
  const t = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await signIn(formData.phone, formData.password)

      if (error) {
        throw error
      }

      toast({
        title: t("auth.signIn"),
        description: t("auth.welcomeBack"),
      })

      // Redirect to localized dashboard
      setTimeout(() => {
        router.push(`/${locale}/dashboard`)
      }, 1000)
    } catch (error: any) {
      toast({
        title: t("errors.registrationFailed"),
        description: error.message || t("errors.checkInfoAndTryAgain"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-gray-800">
      <MobileNav />
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                <Heart className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t("auth.welcomeBack")}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{t("auth.signIn")}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  {t("auth.phoneNumber")}
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+123456789"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    {t("auth.password")}
                  </Label>
                  <Link href={`/${locale}/forgot-password`} className="text-xs text-red-700 dark:text-red-400 hover:underline">
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 transition-all py-6 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  t("common.loading")
                ) : (
                  <>
                    {t("auth.signIn")} <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("auth.registerDonor")}{" "}
              <Link href={`/${locale}/register`} className="text-red-700 dark:text-red-400 font-medium hover:underline">
                {t("auth.register")}
              </Link>
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full flex-shrink-0 mt-0.5">
                <Heart className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-sm">
                <p className="font-medium">{t("auth.joinNetwork")}</p>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {t("app.description")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </main>
  )
} 