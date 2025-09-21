"use client"

import { User, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ClinicalInstructorProfilePage() {
  const profileData = {
    fullName: "Prof. Santos",
    email: "instructor.santos@example.com",
    role: "Clinical Instructor",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Clinical Instructor Profile</h1>
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
