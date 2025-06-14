"use client"

import { useI18n } from "@/lib/i18n/client"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const urgencyLevels = ["Urgent", "Normal", "Planned"]

const requestSchema = z.object({
  bloodType: z.string().min(1, "Blood type is required"),
  units: z.string().min(1, "Number of units is required"),
  urgency: z.string().min(1, "Urgency level is required"),
  hospital: z.string().min(1, "Hospital name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  notes: z.string().optional(),
})

type RequestFormData = z.infer<typeof requestSchema>

export default function RequestPage() {
  const t = useI18n()
  const params = useParams()
  const locale = params.locale as string
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
  })

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true)
    try {
      // Here you would typically make an API call to submit the request
      console.log("Submitting request:", data)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert("Blood request submitted successfully!")
    } catch (error) {
      console.error("Error submitting request:", error)
      alert("Failed to submit request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-gray-800">
      <MobileNav />
      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Request Blood</h1>
              <p className="text-muted-foreground">Submit a blood request for patients in need</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Blood Request Form</CardTitle>
              <CardDescription>Fill in the details below to request blood</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bloodType">Blood Type Required</Label>
                    <Select onValueChange={(value) => setValue("bloodType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.bloodType && (
                      <p className="text-sm text-red-500">{errors.bloodType.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="units">Number of Units</Label>
                    <Input
                      id="units"
                      type="number"
                      min="1"
                      {...register("units")}
                    />
                    {errors.units && (
                      <p className="text-sm text-red-500">{errors.units.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency Level</Label>
                  <Select onValueChange={(value) => setValue("urgency", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency level" />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.urgency && (
                    <p className="text-sm text-red-500">{errors.urgency.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hospital">Hospital Name</Label>
                  <Input
                    id="hospital"
                    {...register("hospital")}
                    placeholder="Enter hospital name"
                  />
                  {errors.hospital && (
                    <p className="text-sm text-red-500">{errors.hospital.message}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input
                      id="contactName"
                      {...register("contactName")}
                      placeholder="Enter contact name"
                    />
                    {errors.contactName && (
                      <p className="text-sm text-red-500">{errors.contactName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      {...register("contactPhone")}
                      placeholder="Enter contact phone"
                    />
                    {errors.contactPhone && (
                      <p className="text-sm text-red-500">{errors.contactPhone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    placeholder="Any additional information"
                    rows={4}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
} 