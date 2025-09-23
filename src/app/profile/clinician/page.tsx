"use client"

import { User, Mail, Activity, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const poppinsFont = {
  fontFamily: "'Poppins', sans-serif",
}

export default function ClinicianProfilePage() {
  const profileData = {
    fullName: "Maria Santos",
    section: "Section A",
    yearLevel: "5th Year",
    email: "maria.santos@example.com",
    studentId: "2019-12345",
    recentActivities: [
      { id: "ACT-001", procedure: "Tooth Extraction", patient: "Joanne Joaquin", status: "Completed", date: "9:30 AM" },
      { id: "ACT-002", procedure: "Dental Cleaning", patient: "Pedro Penduko", status: "In Progress", date: "11:00 AM" },
      { id: "ACT-003", procedure: "Dental Filling", patient: "Jose Rizal", status: "Pending", date: "2:00 PM" },
      { id: "ACT-004", procedure: "Root Canal", patient: "Juan Cruz", status: "Completed", date: "Yesterday" },
      { id: "ACT-005", procedure: "Oral Prophylaxis", patient: "Ana Reyes", status: "Completed", date: "Yesterday" },
    ],
    attendanceSummary: {
      sessionsThisMonth: 18,
      totalSessions: 20,
      attendanceRate: 90,
    },
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6 p-6 bg-[#f9f9f9] min-h-screen" style={poppinsFont}>
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Clinician Profile</h1>
        <p className="text-gray-500 text-sm">Manage your personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <p className="text-lg font-semibold text-[#333]">{profileData.fullName}</p>
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

          <Card className="bg-white border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#333]">
                <Activity className="h-5 w-5" />
                Recent Activities
                <Badge className="ml-2">Last 5</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profileData.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-[#333]">{activity.procedure}</p>
                        <Badge className={getStatusColor(activity.status)}>{activity.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">Patient: {activity.patient}</p>
                      <p className="text-xs text-gray-500">{activity.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side: Attendance + Stats */}
        <div className="space-y-6">
          <Card className="bg-white border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#333]">
                <Clock className="h-5 w-5" />
                Attendance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#5C8E77] mb-2">
                  {profileData.attendanceSummary.attendanceRate}%
                </div>
                <p className="text-sm text-gray-500">Attendance Rate</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sessions This Month</span>
                  <span className="font-semibold text-[#333]">{profileData.attendanceSummary.sessionsThisMonth}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Sessions</span>
                  <span className="font-semibold text-[#333]">{profileData.attendanceSummary.totalSessions}</span>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#5C8E77] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${profileData.attendanceSummary.attendanceRate}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#333]">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed Procedures</span>
                <Badge className="bg-green-100 text-green-800">3</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">In Progress</span>
                <Badge className="bg-blue-100 text-blue-800">1</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending</span>
                <Badge className="bg-yellow-100 text-yellow-800">1</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
