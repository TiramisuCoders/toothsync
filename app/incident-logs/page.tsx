"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function IncidentLogsPage() {
  return (
    <DashboardLayout currentRole="admin">
      <div className="flex flex-col gap-6">
        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-semibold text-[#333]">Incident Logs</h2>
          <p className="text-gray-500">View and manage reported issues or anomalies in the system</p>
        </div>

        {/* Incident Logs Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-4 border-b border-gray-200">
            <CardTitle className="text-xl font-semibold text-[#333]">Reported Incidents</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-gray-100 p-4 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-500"
                >
                  <path d="M15 4h3a2 2 0 0 1 2 2v14c0 1.1-.9 2-2 2H6a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2h3" />
                  <path d="M14 2H10a2 2 0 0 0-2 2v2h8V4c0-1.1-.9-2-2-2Z" />
                  <path d="M12 11h.01" />
                  <path d="M12 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No incidents reported yet</h3>
              <p className="text-gray-500 max-w-md">
                This section is currently empty. Reported issues, anomalies, or flagged events will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
