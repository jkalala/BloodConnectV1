"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/contexts/auth-context"
import { useI18n } from "@/lib/i18n/client"

export default function RegisterPage() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.split("/")[1] || "en"
  const { signUp } = useAuth()
  const t = useI18n()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    bloodType: "",
    location: "",
    allowLocation: false,
    receiveAlerts: true,
    lastDonation: "",
    medicalConditions: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.phone || !formData.bloodType) {
        toast({
          title: t("errors.missingInfo"),
          description: t("errors.fillRequiredFields"),
          variant: "destructive",
        })
        return
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: t("errors.passwordsDontMatch"),
          description: t("errors.passwordsMustMatch"),
          variant: "destructive",
        })
        return
      }
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Use the signUp method from auth context
      const { error, data } = await signUp({
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        bloodType: formData.bloodType,
        location: formData.location || "Unknown",
        allowLocation: formData.allowLocation,
        receiveAlerts: formData.receiveAlerts,
        lastDonation: formData.lastDonation || null,
        medicalConditions: formData.medicalConditions || null,
      })

      if (error) {
        throw error
      }

      toast({
        title: t("auth.registrationSuccess"),
        description: t("auth.verifyPhone"),
      })

      // Make sure we use the locale-prefixed redirect URL
      const redirectUrl = `/${currentLocale}/dashboard`
      console.log("Redirecting to verification with redirect:", redirectUrl)
      
      // Redirect to verification page with locale prefix and correct redirect URL
      router.push(`/${currentLocale}/verify?phone=${encodeURIComponent(formData.phone)}&redirect=${encodeURIComponent(redirectUrl)}`)
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
    <main className="flex min-h-screen flex-col">
      <MobileNav />
      <div className="flex-1 p-4">
        <div className="max-w-md mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{t("auth.registerDonor")}</h1>
            <p className="text-muted-foreground">{t("auth.joinNetwork")}</p>
          </div>

          <div className="flex justify-between mb-6">
            <div className={`h-2 flex-1 ${step >= 1 ? "bg-red-600" : "bg-gray-200"}`}></div>
            <div className="w-2"></div>
            <div className={`h-2 flex-1 ${step >= 2 ? "bg-red-600" : "bg-gray-200"}`}></div>
            <div className="w-2"></div>
            <div className={`h-2 flex-1 ${step >= 3 ? "bg-red-600" : "bg-gray-200"}`}></div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("auth.fullName")}</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("auth.enterFullName")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t("auth.phoneNumber")}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+123456789"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t("auth.createPassword")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder={t("auth.confirmPassword")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodType">{t("auth.bloodType")}</Label>
                  <Select value={formData.bloodType} onValueChange={(value) => handleSelectChange("bloodType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("auth.selectBloodType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4">
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">{t("auth.location")}</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder={t("auth.enterLocation")}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowLocation"
                    checked={formData.allowLocation}
                    onCheckedChange={(checked) => handleCheckboxChange("allowLocation", checked as boolean)}
                  />
                  <Label htmlFor="allowLocation">{t("auth.allowLocationAccess")}</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="receiveAlerts"
                    checked={formData.receiveAlerts}
                    onCheckedChange={(checked) => handleCheckboxChange("receiveAlerts", checked as boolean)}
                  />
                  <Label htmlFor="receiveAlerts">{t("auth.receiveAlerts")}</Label>
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    {t("common.back")}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lastDonation">{t("auth.lastDonation")}</Label>
                  <Input
                    id="lastDonation"
                    name="lastDonation"
                    type="date"
                    value={formData.lastDonation}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalConditions">{t("auth.medicalConditions")}</Label>
                  <Input
                    id="medicalConditions"
                    name="medicalConditions"
                    value={formData.medicalConditions}
                    onChange={handleChange}
                    placeholder={t("auth.enterMedicalConditions")}
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    {t("common.back")}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? t("common.loading") : t("auth.register")}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
      <Toaster />
    </main>
  )
} 