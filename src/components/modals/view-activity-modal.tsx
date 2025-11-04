"use client"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"

interface ProcedureStatus {
  ap_id: string
  procedure: string
  status: string
  remarks: string
}

interface RecordInstance {
  id: string
  date: string
  timeIn: string
  timeOut: string
  instructorName: string
  chair: string
  procedureStatuses: ProcedureStatus[]
}

interface ProcedureDetail {
  name: string
  status: string
  remarks: string
  ap_id: string
}

interface ViewActModalProps {
  isOpen: boolean
  onClose: () => void
  currentActivity?: any
}

export default function ViewActModal({ isOpen, onClose, currentActivity }: ViewActModalProps) {
  const [activeTab, setActiveTab] = useState("current")
  const [localProcedures, setLocalProcedures] = useState<ProcedureDetail[]>([])

  useEffect(() => {
    if (isOpen && currentActivity) {
      const initialData = getLatestProcedureData()
      setLocalProcedures(initialData)
    }
  }, [isOpen, currentActivity])

  const getLatestProcedureData = () => {
    if (!currentActivity?.allRecords || currentActivity.allRecords.length === 0) {
      return currentActivity?.procedureDetails || []
    }

    const latestRecord = currentActivity.allRecords[0]

    return (
      currentActivity.procedures?.map((procName: string) => {
        const procStatus = latestRecord.procedureStatuses?.find((ps: ProcedureStatus) => ps.procedure === procName)

        return {
          name: procName,
          status: procStatus?.status || "In Progress",
          remarks: procStatus?.remarks || "",
          ap_id: procStatus?.ap_id || "",
        }
      }) || []
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden rounded-lg max-h-[90vh] [&>button]:hidden">
        <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Activity Details</DialogTitle>
          </div>
        </DialogHeader>

        {currentActivity && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                <TabsTrigger
                  value="current"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#5C8E77]"
                >
                  Current Assessment
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#5C8E77]"
                >
                  Previous Records ({currentActivity.allRecords?.length || 0})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-220px)]">
              {/* Current Assessment Tab */}
              <TabsContent value="current" className="mt-0">
                {/* Activity Info */}
                <div className="mb-6 p-4 bg-[#f8f9fa] rounded-md border border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Activity ID</p>
                      <p className="font-medium text-[#333]">{currentActivity.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Clinician</p>
                      <p className="font-medium text-[#333]">{currentActivity.clinicianName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Patient</p>
                      <p className="font-medium text-[#333]">{currentActivity.patientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Patient Type</p>
                      <p className="font-medium text-[#333]">{currentActivity.patientType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Chair</p>
                      <p className="font-medium text-[#333]">{currentActivity.chair}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Instructor</p>
                      <p className="font-medium text-[#333]">{currentActivity.instructorName}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium text-[#333]">{currentActivity.date}</p>
                    </div>
                  </div>
                </div>

                {/* Procedures - Display Only */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-[#333] mb-3">Procedure Assessment</h3>

                  {localProcedures && localProcedures.length > 0 ? (
                    localProcedures.length > 1 ? (
                      <Tabs defaultValue="0" className="w-full">
                        <TabsList
                          className="grid w-full bg-gray-100"
                          style={{ gridTemplateColumns: `repeat(${localProcedures.length}, 1fr)` }}
                        >
                          {localProcedures.map((procedure, index) => (
                            <TabsTrigger
                              key={index}
                              value={index.toString()}
                              className="data-[state=active]:bg-white data-[state=active]:text-[#5C8E77]"
                            >
                              Procedure {index + 1}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {localProcedures.map((procedure, index) => (
                          <TabsContent key={index} value={index.toString()} className="mt-4">
                            <div className="border rounded-lg p-4 bg-white">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-block w-3 h-3 rounded-full ${
                                      procedure.status === "Completed"
                                        ? "bg-[#5C8E77]"
                                        : procedure.status === "In Progress"
                                          ? "bg-blue-500"
                                          : "bg-gray-300"
                                    }`}
                                  ></span>
                                  <p className="font-medium text-[#333]">{procedure.name}</p>
                                </div>
                                {procedure.status === "Completed" && (
                                  <Badge className="bg-[#5C8E77]/10 text-[#5C8E77] hover:bg-[#5C8E77]/10">
                                    Completed
                                  </Badge>
                                )}
                                {procedure.status === "In Progress" && (
                                  <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/10">
                                    In Progress
                                  </Badge>
                                )}
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm text-gray-600">Status</Label>
                                  <p className="mt-1 text-sm font-medium text-gray-900">{procedure.status}</p>
                                </div>
                                <div>
                                  <Label className="text-sm text-gray-600">Remarks</Label>
                                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                                    {procedure.remarks || "—"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    ) : (
                      // Single procedure display
                      <div className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block w-3 h-3 rounded-full ${
                                localProcedures[0].status === "Completed"
                                  ? "bg-[#5C8E77]"
                                  : localProcedures[0].status === "In Progress"
                                    ? "bg-blue-500"
                                    : "bg-gray-300"
                              }`}
                            ></span>
                            <p className="font-medium text-[#333]">{localProcedures[0].name}</p>
                          </div>
                          {localProcedures[0].status === "Completed" && (
                            <Badge className="bg-[#5C8E77]/10 text-[#5C8E77] hover:bg-[#5C8E77]/10">Completed</Badge>
                          )}
                          {localProcedures[0].status === "In Progress" && (
                            <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/10">In Progress</Badge>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm text-gray-600">Status</Label>
                            <p className="mt-1 text-sm font-medium text-gray-900">{localProcedures[0].status}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">Remarks</Label>
                            <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                              {localProcedures[0].remarks || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">No procedures available</div>
                  )}
                </div>
              </TabsContent>

              {/* Previous Records Tab */}
              <TabsContent value="history" className="mt-0">
                <div className="space-y-4">
                  {currentActivity.allRecords && currentActivity.allRecords.length > 0 ? (
                    currentActivity.allRecords.map((record: RecordInstance, recordIndex: number) => (
                      <div
                        key={recordIndex}
                        className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
                      >
                        {/* Date Badge */}
                        <div className="inline-block ml-4 mt-4">
                          <div className="bg-[#5C8E77] text-white px-4 py-1.5 rounded-md font-semibold text-sm">
                            {record.date}
                          </div>
                        </div>

                        {/* Session Details */}
                        <div className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4">
                            <div>
                              <p className="text-sm text-gray-600 font-medium mb-0.5">Instructor</p>
                              <p className="text-base font-semibold text-gray-900">{record.instructorName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-medium mb-0.5">Chair</p>
                              <p className="text-base font-semibold text-gray-900">{record.chair}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-medium mb-0.5">Time In</p>
                              <p className="text-base font-semibold text-gray-900">{record.timeIn}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-medium mb-0.5">Time Out</p>
                              <p className="text-base font-semibold text-gray-900">{record.timeOut}</p>
                            </div>
                          </div>

                          {/* Procedures Table */}
                          <div className="mt-4">
                            <div className="overflow-hidden border border-gray-200 rounded-md">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                                      Procedure
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                                      Status
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                                      Remarks
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {record.procedureStatuses && record.procedureStatuses.length > 0 ? (
                                    record.procedureStatuses.map((procStatus: ProcedureStatus, idx: number) => (
                                      <tr key={idx}>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                          {procStatus.procedure}
                                        </td>
                                        <td className="px-4 py-3">
                                          <Badge
                                            className={
                                              procStatus.status === "Completed"
                                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                : procStatus.status === "In Progress"
                                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                            }
                                          >
                                            {procStatus.status}
                                          </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{procStatus.remarks || "—"}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={3} className="px-4 py-3 text-sm text-gray-500 text-center">
                                        No procedure data available
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No previous records available for this activity
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}

        <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} className="border-gray-300 bg-transparent">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
