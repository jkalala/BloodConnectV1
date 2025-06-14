"use client"

import { useI18n } from "@/lib/i18n/client"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter } from "lucide-react"

export default function InventoryPage() {
  const t = useI18n()
  const params = useParams()
  const locale = params.locale as string

  // Mock data for blood inventory
  const bloodInventory = [
    {
      id: "B001",
      bloodType: "O+",
      units: 15,
      expiryDate: "2024-04-15",
      status: "Available",
      location: "Main Storage"
    },
    {
      id: "B002",
      bloodType: "A-",
      units: 8,
      expiryDate: "2024-04-10",
      status: "Low",
      location: "Main Storage"
    },
    {
      id: "B003",
      bloodType: "B+",
      units: 3,
      expiryDate: "2024-04-05",
      status: "Critical",
      location: "Emergency Storage"
    },
    // Add more mock data as needed
  ]

  // Mock data for supplies
  const supplies = [
    {
      id: "S001",
      name: "Blood Collection Bags",
      quantity: 100,
      reorderLevel: 20,
      status: "In Stock"
    },
    {
      id: "S002",
      name: "IV Sets",
      quantity: 50,
      reorderLevel: 15,
      status: "Low Stock"
    },
    {
      id: "S003",
      name: "Testing Kits",
      quantity: 75,
      reorderLevel: 25,
      status: "In Stock"
    }
  ]

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-gray-800">
      <MobileNav />
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Inventory Management</h1>
              <p className="text-muted-foreground">Track blood units and supplies</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Item
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                className="w-full pl-8"
              />
            </div>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Blood Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Blood Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bloodInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.bloodType}</TableCell>
                      <TableCell>{item.units}</TableCell>
                      <TableCell>{item.expiryDate}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "Available"
                              ? "default"
                              : item.status === "Low"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Supplies */}
          <Card>
            <CardHeader>
              <CardTitle>Supplies</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplies.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.reorderLevel}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "In Stock"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
} 