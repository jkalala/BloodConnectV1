"use client"

import { useI18n } from "@/lib/i18n/client"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

const monthlyData = [
  { month: "Jan", donations: 2 },
  { month: "Feb", donations: 1 },
  { month: "Mar", donations: 3 },
  { month: "Apr", donations: 0 },
  { month: "May", donations: 2 },
  { month: "Jun", donations: 1 }
]

const bloodTypeData = [
  { name: "O+", value: 4 },
  { name: "A+", value: 2 },
  { name: "B+", value: 1 },
  { name: "AB+", value: 1 }
]

const impactData = [
  { month: "Jan", lives: 6 },
  { month: "Feb", lives: 3 },
  { month: "Mar", lives: 9 },
  { month: "Apr", lives: 0 },
  { month: "May", lives: 6 },
  { month: "Jun", lives: 3 }
]

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b"]

export default function AnalyticsPage() {
  const t = useI18n()
  const params = useParams()
  const locale = params.locale as string
  const [timeRange, setTimeRange] = useState("6m")

  const totalDonations = monthlyData.reduce((sum, item) => sum + item.donations, 0)
  const totalLives = impactData.reduce((sum, item) => sum + item.lives, 0)
  const averageDonations = (totalDonations / monthlyData.length).toFixed(1)

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-gray-800">
      <MobileNav />
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="text-muted-foreground">Track your donation impact and statistics</p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Donations</CardTitle>
                <CardDescription>Your lifetime donations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalDonations}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Lives Impacted</CardTitle>
                <CardDescription>Estimated lives saved</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalLives}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Average Donations</CardTitle>
                <CardDescription>Per month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{averageDonations}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="donations" className="space-y-4">
            <TabsList>
              <TabsTrigger value="donations">Donation History</TabsTrigger>
              <TabsTrigger value="bloodTypes">Blood Types</TabsTrigger>
              <TabsTrigger value="impact">Impact</TabsTrigger>
            </TabsList>

            <TabsContent value="donations">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Donations</CardTitle>
                  <CardDescription>Your donation frequency over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="donations" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bloodTypes">
              <Card>
                <CardHeader>
                  <CardTitle>Blood Type Distribution</CardTitle>
                  <CardDescription>Types of blood you've donated</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bloodTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {bloodTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="impact">
              <Card>
                <CardHeader>
                  <CardTitle>Lives Impacted</CardTitle>
                  <CardDescription>Estimated lives saved over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={impactData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="lives" stroke="#22c55e" />
                      </LineChart>
                    </ResponsiveContainer>
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