"use client"

import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Sample data for activities
const activities = [
  {
    id: "ACT-001",
    firstName: "Maria",
    lastName: "Santos",
    patientName: "Joanne Joaquin",
    chair: "Chair 1",
    date: "2025-05-09T09:30:00",
    procedure: "Tooth Extraction", // Keep for backward compatibility
    procedures: ["Tooth Extraction", "Dental Cleaning"],
    status: "Completed",
  },
  {
    id: "ACT-002",
    firstName: "Maria",
    lastName: "Santos",
    patientName: "Pedro Penduko",
    chair: "Chair 3",
    date: "2025-05-09T11:00:00",
    procedure: "Dental Cleaning",
    status: "In Progress",
  },
  {
    id: "ACT-003",
    firstName: "Maria",
    lastName: "Santos",
    patientName: "Jose Rizal",
    chair: "Chair 2",
    date: "2025-05-09T14:00:00",
    procedure: "Dental Filling",
    procedures: ["Dental Filling", "Consultation"],
    status: "Pending",
  },
  {
    id: "ACT-004",
    firstName: "Maria",
    lastName: "Santos",
    patientName: "Andres Bonifacio",
    chair: "Chair 4",
    date: "2025-05-08T10:15:00",
    procedure: "Root Canal",
    status: "Completed",
  },
  {
    id: "ACT-005",
    firstName: "Maria",
    lastName: "Santos",
    patientName: "Emilio Aguinaldo",
    chair: "Chair 2",
    date: "2025-05-07T13:45:00",
    procedure: "Dental Implant",
    procedures: ["Dental Implant", "X-Ray"],
    status: "Completed",
  },
]

export default function ClinicianActivities() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Activities</h1>

      {/* Activities Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold py-3">Act ID</TableHead>
                <TableHead className="font-semibold py-3">Clinician</TableHead>
                <TableHead className="font-semibold py-3">Patient</TableHead>
                <TableHead className="font-semibold py-3">Procedure</TableHead>
                <TableHead className="font-semibold py-3">Chair</TableHead>
                <TableHead className="font-semibold py-3">Date</TableHead>
                <TableHead className="font-semibold py-3">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id} className="hover:bg-gray-50 border-b">
                  <TableCell className="py-3">{activity.id}</TableCell>
                  <TableCell className="py-3">
                    {activity.firstName} {activity.lastName}
                  </TableCell>
                  <TableCell className="py-3">{activity.patientName}</TableCell>
                  <TableCell className="py-3">
                    {activity.procedures ? (
                      <div className="space-y-1">
                        {activity.procedures.map((proc, index) => (
                          <div key={index} className="text-sm">
                            {proc}
                          </div>
                        ))}
                      </div>
                    ) : (
                      activity.procedure
                    )}
                  </TableCell>
                  <TableCell className="py-3">{activity.chair}</TableCell>
                  <TableCell className="py-3">{format(new Date(activity.date), "MMM d, yyyy h:mm a")}</TableCell>
                  <TableCell className="py-3">
                    <Badge
                      className={
                        activity.status === "Completed"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : activity.status === "In Progress"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                      }
                    >
                      {activity.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
