import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "../ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface Chair {
  chair_id: string
  chair_name: string
}

interface Instructor {
  id: string
  name: string
}

interface GradingModalProps {
  isOpen: boolean
  onClose: () => void
  currentActivity?: any
  onProcedureChange: (index: number, field: 'grade' | 'remarks', value: string) => void
  // onActivityChange: (field: 'chair' | 'instructor', value: string) => void
  onSave: () => void
  // chairs: Chair[]
  // instructors: Instructor[]
}

export default function GradingModal({ 
  isOpen, 
  onClose, 
  currentActivity, 
  onProcedureChange, 
  // onActivityChange,
  onSave,
  // chairs,
  // instructors
}: GradingModalProps) {
    
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-lg max-h-[90vh]">
        <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Grade Activity</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {currentActivity && (
            <>
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
                 
                  {/* <div>
                    <Label className="text-sm text-gray-500">Instructor</Label>
                    <Select
                      value={currentActivity.instructor || ""}
                      onValueChange={(value) => onActivityChange('instructor', value)}
                    >
                      <SelectTrigger className="mt-1 border-gray-300">
                        <SelectValue placeholder={currentActivity.instructor} />
                      </SelectTrigger>
                      {/* <SelectContent>
                        {instructors.map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {instructor.name}
                          </SelectItem>
                        ))}
                      </SelectContent> *
                    </Select>
                  </div> */}
                  <div>
                    <p className="text-sm text-gray-500">Activity ID</p>
                    <p className="font-medium text-[#333]">{currentActivity.id}</p>
                  </div>
                </div>
              </div>

              {/* Procedures Grading with Tabs */}
              <div className="space-y-4">
                <h3 className="font-semibold text-[#333] mb-3">Grade Each Procedure</h3>
                
                {currentActivity.procedureDetails && currentActivity.procedureDetails.length > 0 ? (
                  currentActivity.procedureDetails.length > 1 ? (
                    <Tabs defaultValue="0" className="w-full">
                      <TabsList
                        className="grid w-full bg-gray-100"
                        style={{ gridTemplateColumns: `repeat(${currentActivity.procedureDetails.length}, 1fr)` }}
                      >
                        {currentActivity.procedureDetails.map((procedure, index) => (
                          <TabsTrigger 
                            key={index} 
                            value={index.toString()}
                            className="data-[state=active]:bg-white data-[state=active]:text-[#5C8E77]"
                          >
                            Procedure {index + 1}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {currentActivity.procedureDetails.map((procedure, index) => (
                        <TabsContent key={index} value={index.toString()} className="mt-4">
                          <div className="border rounded-lg p-4 bg-white">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                {/* <span className={`inline-block w-3 h-3 rounded-full ${
                                  procedure.status === "Completed" ? "bg-[#5C8E77]" : "bg-gray-300"
                                }`}></span> */}
                                <p className="font-medium text-[#333]">{procedure.name}</p>
                              </div>
                              {procedure.status === "Completed" && (
                                <Badge className="bg-[#5C8E77]/10 text-[#5C8E77] hover:bg-[#5C8E77]/10">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm text-gray-600">Grade (0-100)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="Enter grade"
                                  value={procedure.grade || ""}
                                  onChange={(e) => onProcedureChange(index, "grade", e.target.value)}
                                  className="mt-1 border-gray-300"
                                />
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
                            currentActivity.procedureDetails[0].status === "Completed" 
                              ? "bg-[#5C8E77]" 
                              : "bg-gray-300"
                          }`}></span>
                          <p className="font-medium text-[#333]">{currentActivity.procedureDetails[0].name}</p>
                        </div>
                        {currentActivity.procedureDetails[0].status === "Completed" && (
                          <Badge className="bg-[#5C8E77]/10 text-[#5C8E77] hover:bg-[#5C8E77]/10">
                            Completed
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm text-gray-600">Grade (0-100)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Enter grade"
                            value={currentActivity.procedureDetails[0].grade || ""}
                            onChange={(e) => onProcedureChange(0, "grade", e.target.value)}
                            className="mt-1 border-gray-300"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Remarks (Optional)</Label>
                          <Textarea
                            placeholder="Enter your feedback or observations"
                            value={currentActivity.procedureDetails[0].remarks || ""}
                            onChange={(e) => onProcedureChange(0, "remarks", e.target.value)}
                            className="mt-1 border-gray-300 min-h-[100px]"
                          />
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  currentActivity.procedures?.map((procedureName, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-full bg-gray-300"></span>
                          <p className="font-medium text-[#333]">{procedureName}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm text-gray-600">Grade (0-100)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Enter grade"
                            onChange={(e) => onProcedureChange(index, "grade", e.target.value)}
                            className="mt-1 border-gray-300"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Remarks (Optional)</Label>
                          <Textarea
                            placeholder="Enter your feedback or observations"
                            onChange={(e) => onProcedureChange(index, "remarks", e.target.value)}
                            className="mt-1 border-gray-300 min-h-[100px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
        <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} className="border-gray-300">
            Cancel
          </Button>
          <Button
            className="bg-[#5C8E77] hover:bg-[#406E58] text-white"
            onClick={onSave}
            disabled={!currentActivity?.procedureDetails?.some(p => p.grade && String(p.grade || "").trim() !== "")}
          >
            Save Assessment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}