"use client"

import React, { useState } from "react"
import { useI18n } from "@/lib/i18n/client"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
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
import { createBloodRequest } from "@/app/actions/blood-request-actions"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const urgencyLevels = ["normal", "urgent", "critical"]

const requestSchema = z.object({
  patient_name: z.string().min(1, "Patient name is required"),
  hospital_name: z.string().min(1, "Hospital name is required"),
  blood_type: z.string().min(1, "Blood type is required"),
  units_needed: z.string().min(1, "Number of units is required"),
  urgency: z.string().min(1, "Urgency level is required"),
  contact_name: z.string().min(1, "Contact name is required"),
  contact_phone: z.string().min(1, "Contact phone is required"),
  additional_info: z.string().optional(),
  location: z.string().optional(),
})

type RequestFormData = z.infer<typeof requestSchema>

export default function RequestPage() {
  const t = useI18n()
  const params = useParams()
  const locale = params.locale as string
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      contact_name: user?.user_metadata?.name || "",
      contact_phone: user?.user_metadata?.phone || "",
    }
  })

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true)
    try {
      const result = await createBloodRequest({
        ...data,
        units_needed: parseInt(data.units_needed),
        urgency: data.urgency as 'normal' | 'urgent' | 'critical',
      })

      if (result.success) {
        toast({
          title: "Blood request submitted successfully!",
          description: "We're finding compatible donors for you.",
        })
        reset()
      } else {
        toast({
          title: "Failed to submit request",
          description: result.error || "Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting request:", error)
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      })
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
                <div className="space-y-2">
                  <Label htmlFor="patient_name">Patient Name</Label>
                  <Input
                    id="patient_name"
                    {...register("patient_name")}
                    placeholder="Enter patient name"
                  />
                  {errors.patient_name && (
                    <p className="text-sm text-red-500">{errors.patient_name.message}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="blood_type">Blood Type Required</Label>
                    <Select onValueChange={(value) => setValue("blood_type", value)}>
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
                    {errors.blood_type && (
                      <p className="text-sm text-red-500">{errors.blood_type.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="units_needed">Number of Units</Label>
                    <Input
                      id="units_needed"
                      type="number"
                      min="1"
                      {...register("units_needed")}
                    />
                    {errors.units_needed && (
                      <p className="text-sm text-red-500">{errors.units_needed.message}</p>
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
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.urgency && (
                    <p className="text-sm text-red-500">{errors.urgency.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hospital_name">Hospital Name</Label>
                  <Input
                    id="hospital_name"
                    {...register("hospital_name")}
                    placeholder="Enter hospital name"
                  />
                  {errors.hospital_name && (
                    <p className="text-sm text-red-500">{errors.hospital_name.message}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input
                      id="contact_name"
                      {...register("contact_name")}
                      placeholder="Enter contact name"
                    />
                    {errors.contact_name && (
                      <p className="text-sm text-red-500">{errors.contact_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      {...register("contact_phone")}
                      placeholder="Enter contact phone"
                    />
                    {errors.contact_phone && (
                      <p className="text-sm text-red-500">{errors.contact_phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    {...register("location")}
                    placeholder="Enter location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_info">Additional Notes</Label>
                  <Textarea
                    id="additional_info"
                    {...register("additional_info")}
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