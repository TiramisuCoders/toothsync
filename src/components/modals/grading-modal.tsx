import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "../ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"

interface ProcedureStatus {
  procedure: string
  status: string
  remarks: string
}

interface RecordInstance {
  date: string
  timeIn: string
  timeOut: string
  instructorName: string
  chair: string
  procedureStatuses: ProcedureStatus[]
}

interface GradingModalProps {
  isOpen: boolean
  onClose: () => void
  currentActivity?: any
  onProcedureChange: (index: number, field: 'status' | 'remarks', value: string) => void
  onSave: () => void
}

export default function GradingModal({ 
  isOpen, 
  onClose, 
  currentActivity, 
  onProcedureChange, 
  onSave,
}: GradingModalProps) {
  const [activeTab, setActiveTab] = useState("current")
  const [loading, setLoading] = useState(false)

  // Get the latest procedure statuses from the most recent record
  const getLatestProcedureData = () => {
    if (!currentActivity?.allRecords || currentActivity.allRecords.length === 0) {
      return currentActivity?.procedureDetails || []
    }

    // Get the most recent record (first one since they're sorted by date descending)
    const latestRecord = currentActivity.allRecords[0]
    
    // Map procedure statuses to match the procedureDetails format
    return currentActivity.procedures?.map((procName: string) => {
      const procStatus = latestRecord.procedureStatuses?.find(
        (ps: ProcedureStatus) => ps.procedure === procName
      )
      
      return {
        name: procName,
        status: procStatus?.status || "In Progress",
        remarks: procStatus?.remarks || ""
      }
    }) || []
  }

  const proceduresData = getLatestProcedureData()
    
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden rounded-lg max-h-[90vh]">
        <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Update Activity</DialogTitle>
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
                      <p className="text-sm text-gray-500">Clinician</p>
                      <p className="font-medium text-[#333]">{currentActivity.clinicianName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Patient</p>
                      <p className="font-medium text-[#333]">{currentActivity.patientName}</p>
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
                      <p className="text-sm text-gray-500">Activity ID</p>
                      <p className="font-medium text-[#333]">{currentActivity.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium text-[#333]">{currentActivity.date}</p>
                    </div>
                  </div>
                </div>

                {/* Procedures Grading with Tabs */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-[#333] mb-3">Update Each Procedure</h3>
                  
                  {proceduresData && proceduresData.length > 0 ? (
                    proceduresData.length > 1 ? (
                      <Tabs defaultValue="0" className="w-full">
                        <TabsList
                          className="grid w-full bg-gray-100"
                          style={{ gridTemplateColumns: `repeat(${proceduresData.length}, 1fr)` }}
                        >
                          {proceduresData.map((procedure: any, index: number) => (
                            <TabsTrigger 
                              key={index} 
                              value={index.toString()}
                              className="data-[state=active]:bg-white data-[state=active]:text-[#5C8E77]"
                            >
                              Procedure {index + 1}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {proceduresData.map((procedure: any, index: number) => (
                          <TabsContent key={index} value={index.toString()} className="mt-4">
                            <div className="border rounded-lg p-4 bg-white">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <span className={`inline-block w-3 h-3 rounded-full ${
                                    procedure.status === "Completed" ? "bg-[#5C8E77]" : 
                                    procedure.status === "In Progress" ? "bg-blue-500" : "bg-gray-300"
                                  }`}></span>
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
                                  <Select
                                    value={procedure.status || "In Progress"}
                                    onValueChange={(value) => onProcedureChange(index, "status", value)}
                                  >
                                    <SelectTrigger className="mt-1 border-gray-300">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="In Progress">In Progress</SelectItem>
                                      <SelectItem value="Completed">Completed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-sm text-gray-600">Remarks (Optional)</Label>
                                  <Textarea
                                    placeholder="Enter your feedback or observations"
                                    value={procedure.remarks || ""}
                                    onChange={(e) => onProcedureChange(index, "remarks", e.target.value)}
                                    className="mt-1 border-gray-300 min-h-[100px]"
                                  />
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
                            <span className={`inline-block w-3 h-3 rounded-full ${
                              proceduresData[0].status === "Completed" 
                                ? "bg-[#5C8E77]" 
                                : proceduresData[0].status === "In Progress"
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            }`}></span>
                            <p className="font-medium text-[#333]">{proceduresData[0].name}</p>
                          </div>
                          {proceduresData[0].status === "Completed" && (
                            <Badge className="bg-[#5C8E77]/10 text-[#5C8E77] hover:bg-[#5C8E77]/10">
                              Completed
                            </Badge>
                          )}
                          {proceduresData[0].status === "In Progress" && (
                            <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/10">
                              In Progress
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm text-gray-600">Status</Label>
                            <Select
                              value={proceduresData[0].status || "In Progress"}
                              onValueChange={(value) => onProcedureChange(0, "status", value)}
                            >
                              <SelectTrigger className="mt-1 border-gray-300">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">Remarks (Optional)</Label>
                            <Textarea
                              placeholder="Enter your feedback or observations"
                              value={proceduresData[0].remarks || ""}
                              onChange={(e) => onProcedureChange(0, "remarks", e.target.value)}
                              className="mt-1 border-gray-300 min-h-[100px]"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No procedures available
                    </div>
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
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                          {procStatus.remarks || "—"}
                                        </td>
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
          <Button variant="outline" onClick={onClose} className="border-gray-300">
            Cancel
          </Button>
          <Button
            className="bg-[#5C8E77] hover:bg-[#406E58] text-white"
            onClick={onSave}
          >
            Save Assessment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}