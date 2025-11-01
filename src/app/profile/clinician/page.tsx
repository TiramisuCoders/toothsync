"use client"

import { User, Mail, Activity, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"

const poppinsFont = {
  fontFamily: "'Poppins', sans-serif",
}

export interface ClinicianInfo {
  id: string
  name: string
  email: string
  sex: string
  yearLevel: string
  section: string
  studentId: string
}

export default function ClinicianProfilePage() {
  const [profileData, setClinicianInfo] = useState<ClinicianInfo | null>(null)
  const [loading, setLoading] = useState(true)  
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfileData();
  }, [])

  const fetchProfileData = async () => {
    try{
      setLoading(true)
      setError(null)

      const userResponse = await fetch("/api/getCurrentUser/clinician", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
    
      if (!userResponse.ok) {
        throw new Error(`HTTP error! status: ${userResponse.status}`)
      }
      
      const userInfo = await userResponse.json()
    
      if (userInfo.success) {
        setClinicianInfo(userInfo.data)
      } else {
        throw new Error(userInfo.error || "Failed to fetch user info")
      }
    
          } catch (err) {
            // console.error("Error fetching data:", err)
            toast({
              title: "Error",
              description: "Failed to load dashboard data",
              variant: "destructive"
            })
          } finally {
            setLoading(false)
          }
  }

    // Loading state
  if (loading) {
    return (
      <div className="space-y-6 p-6 bg-[#f9f9f9] min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    )
  }
  // Error state
  if (!profileData) {
    return (
      <div className="space-y-6 p-6 bg-[#f9f9f9] min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-2">
            Unable to load user information
          </h1>
          <p className="text-gray-500">Please try refreshing the page</p>
        </div>
      </div>
    )
  }


  return (
    <div className="space-y-6 p-6 bg-[#f9f9f9] min-h-screen" style={poppinsFont}>
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Clinician Profile</h1>
        {/* <p className="text-gray-500 text-sm">Manage your personal information</p> */}
      </div>

      <div >
        {/* Left side: Info + Activities */}
        <div className="lg:col-span-2 space-y-6">
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
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-lg font-semibold text-[#333]">{profileData.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Section</label>
                  <p className="text-lg font-semibold text-[#333]">{profileData.section}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Year Level</label>
                  <p className="text-lg font-semibold text-[#333]">{profileData.yearLevel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Student ID</label>
                  <p className="text-lg font-semibold text-[#333]">{profileData.studentId}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg font-semibold text-[#333] flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {profileData.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
</div>
      </div>
    </div>
  )
}
