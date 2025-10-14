"use client"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "../ui/button"

interface UnarchiveConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  activity?: any
}

export default function UnarchiveConfirmationModal({ isOpen, onClose,  onConfirm, activity }: UnarchiveConfirmationProps) {
    return(
        <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-lg">
                  <DialogHeader className="bg-[#f8f9fa] px-6 py-4 border-b border-gray-200">
                    <DialogTitle className="text-xl font-semibold text-[#5C8E77]">Confirm Action</DialogTitle>
                  </DialogHeader>
                  <div className="px-6 py-4">
                    <p className="text-[#333]">Are you sure you want to continue this activity?</p>
                    {activity && (
                      <>
                        {/* Activity Info */}
                        <div className="mb-6 p-4 bg-[#f8f9fa] rounded-md border border-gray-200">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-sm text-gray-500">Clinician</p>
                              <p className="font-medium text-[#333]">{activity.clinicianName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Patient</p>
                              <p className="font-medium text-[#333]">{activity.patientName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Chair</p>
                              <p className="font-medium text-[#333]">{activity.chair}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Activity ID</p>
                              <p className="font-medium text-[#333]">{activity.id}</p>
                            </div>                    
                          </div>
                          <div>
                              <p className="text-sm text-gray-500">Procedure/s:</p>
                              {activity.procedures?.length > 0 ? (
                                <ul className="list-disc list-inside font-medium text-[#333]">
                                  {activity.procedures.map((p, i) => (
                                    <li key={i}>{typeof p === "string" ? p : p.name}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="font-medium text-[#333]">No procedures specified</p>
                              )}
                            </div>
                        </div>
                      </>
                    )}
                  </div>
                  <DialogFooter className="bg-[#f8f9fa] px-6 py-4 border-t border-gray-200">
                    <Button variant="outline" onClick={onClose} className="border-gray-300">
                      Cancel
                    </Button>
                    <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={onConfirm}>
                      Confirm
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
    )
}