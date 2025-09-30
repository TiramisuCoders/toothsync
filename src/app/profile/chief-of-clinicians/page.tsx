"use client"

import { User, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ChiefOfCliniciansProfilePage() {
  const profileData = {
    fullName: "Dr. Rodriguez",
    email: "chief.rodriguez@example.com",
    role: "Chief of Clinicians",
  }

  return (
    <div className="space-y-6 p-6 bg-[#f9f9f9] min-h-screen">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Chief of Clinicians Profile</h1>
        <p className="text-gray-500 text-sm">Manage your personal information</p>
      </div>

      <Card className="bg-white border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#333]">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Full Name</label>
              <p className="text-lg font-semibold">{profileData.fullName}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-500">Email</label>
              <p className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {profileData.email}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-500">Role</label>
              <p className="text-lg font-semibold">{profileData.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
