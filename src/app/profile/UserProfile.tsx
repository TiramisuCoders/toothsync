"use client"

import { User, Mail, Briefcase, Phone, UserCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"

interface BaseUserInfo {
  id: string
  firstName: string
  lastName: string
  name: string
  email: string
  sex: string
  contactNumber: string
  role: string
}

interface ClinicianUserInfo extends BaseUserInfo {
  studentId: string
  yearLevel: number
  enrollmentStatus: string
}

interface InstructorUserInfo extends BaseUserInfo {
  employeeId: string
  specializedProcedures: string[]
}

type UserInfo = ClinicianUserInfo | InstructorUserInfo

function isInstructor(user: UserInfo): user is InstructorUserInfo {
  return user.role === "Clinical Instructor"
}

function isClinician(user: UserInfo): user is ClinicianUserInfo {
  return user.role === "Clinician" || user.role === "Clerk"
}

export default function UserProfile() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<UserInfo | null>(null)

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      setError(null)

      const userResponse = await fetch("/api/getCurrentUser/profile", {
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
        setProfileData(userInfo.data)
      } else {
        throw new Error(userInfo.error || "Failed to fetch user info")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load profile data"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !profileData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold text-red-600 mb-2">
            Unable to load profile
          </h1>
          <p className="text-gray-500 mb-4">
            {error || "Please try refreshing the page"}
          </p>
          <button
            onClick={fetchProfileData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const getRoleTitle = () => {
    if (isInstructor(profileData)) return "Clinical Instructor Profile"
    if (profileData.role === "R01") return "Clinician Profile"
    if (profileData.role === "R02") return "Clerk Profile"
    return "User Profile"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">{getRoleTitle()}</h1>
        <p className="text-gray-500 text-sm">View your personal information</p>
      </div>

      {/* Personal Information Card */}
      <Card className="bg-white border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#333]">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="text-sm text-gray-500 block mb-1">Full Name</label>
              <p className="text-lg font-semibold">{profileData.name}</p>
            </div>

            {/* Sex */}
            <div>
              <label className="text-sm text-gray-500 block mb-1">Sex</label>
              <p className="text-lg font-semibold flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-gray-500" />
                {profileData.sex === "M" ? "Male" : profileData.sex === "F" ? "Female" : profileData.sex}
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-gray-500 block mb-1">Email</label>
              <p className="text-base font-medium flex items-center gap-2 break-all">
                <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                {profileData.email}
              </p>
            </div>

            {/* Contact Number */}
            <div>
              <label className="text-sm text-gray-500 block mb-1">Contact Number</label>
              <p className="text-base font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                {profileData.contactNumber || "Not provided"}
              </p>
            </div>

            {/* Role */}
            <div>
              <label className="text-sm text-gray-500 block mb-1">Role</label>
              <p className="text-base font-medium flex items-center gap-2">
                {profileData.role}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic/Professional Information Card */}
      {(isInstructor(profileData) || isClinician(profileData)) && (
        <Card className="bg-white border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#333]">
              <Briefcase className="h-5 w-5" />
              {isInstructor(profileData) ? "Professional Information" : "Academic Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isInstructor(profileData) && (
                <>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Employee ID</label>
                    <p className="text-base font-medium">
                      {profileData.employeeId}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-500 block mb-2">
                      Specialized Procedures
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {profileData.specializedProcedures?.length > 0 ? (
                        profileData.specializedProcedures.map((procedure, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full"
                          >
                            {procedure}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm">No specializations assigned</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {isClinician(profileData) && (
                <>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Student ID</label>
                    <p className="text-base font-medium">
                      {profileData.studentId}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Year Level</label>
                    <p className="text-base font-medium">
                      Year {profileData.yearLevel}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Enrollment Status</label>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        profileData.enrollmentStatus?.toLowerCase() === "enrolled"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {profileData.enrollmentStatus || "N/A"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}