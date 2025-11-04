"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sun, Sunset, Calendar, CheckCircle2 } from "lucide-react"

interface AddScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitSingle: (data: { date: string; shift: string }) => Promise<void>
  onSubmitBulk: (data: {
    startDate: string
    endDate: string
    daysOfWeek: number[]
    shift: string
  }) => Promise<void>
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
]

const SHIFTS = [
  { value: "1st", label: "1st Shift", time: "8:00 AM - 12:00 PM" },
  { value: "2nd", label: "2nd Shift", time: "12:00 PM - 5:00 PM" },
]

export default function AddScheduleModal({ 
  open, 
  onOpenChange, 
  onSubmitSingle,
  onSubmitBulk 
}: AddScheduleModalProps) {
  const [activeTab, setActiveTab] = useState("single")
  
  // Single schedule state
  const [singleFormData, setSingleFormData] = useState({
    date: "",
    shift: "",
  })
  const [isSingleSubmitting, setIsSingleSubmitting] = useState(false)

  // Bulk schedule state
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [selectedShift, setSelectedShift] = useState("")
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false)

  const resetSingleForm = () => {
    setSingleFormData({ date: "", shift: "" })
  }

  const resetBulkForm = () => {
    setStartDate("")
    setEndDate("")
    setSelectedDays([])
    setSelectedShift("")
  }

  const handleSingleSubmit = async () => {
    setIsSingleSubmitting(true)
    try {
      await onSubmitSingle(singleFormData)
      resetSingleForm()
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting single schedule:', error)
    } finally {
      setIsSingleSubmitting(false)
    }
  }

  const handleBulkSubmit = async () => {
    if (!startDate || !endDate || selectedDays.length === 0 || !selectedShift) {
      return
    }

    setIsBulkSubmitting(true)
    try {
      await onSubmitBulk({
        startDate,
        endDate,
        daysOfWeek: selectedDays,
        shift: selectedShift,
      })
      resetBulkForm()
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting bulk schedule:', error)
    } finally {
      setIsBulkSubmitting(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    resetSingleForm()
    resetBulkForm()
  }

  const toggleDay = (dayValue: number) => {
    setSelectedDays(prev =>
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue].sort()
    )
  }

  const getExpectedCount = () => {
    if (!startDate || !endDate || selectedDays.length === 0) return 0

    const start = new Date(startDate)
    const end = new Date(endDate)
    let count = 0
    const current = new Date(start)

    while (current <= end) {
      if (selectedDays.includes(current.getDay())) {
        count++
      }
      current.setDate(current.getDate() + 1)
    }

    return count
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] [&>button]:hidden">
        <DialogHeader>
          <DialogTitle>Add Schedule</DialogTitle>
          {/* <DialogDescription>
            Create a single schedule or multiple schedules at once
          </DialogDescription> */}
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Schedule</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Schedule</TabsTrigger>
          </TabsList>

          {/* Single Schedule Tab */}
          <TabsContent value="single" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                min={today}
                value={singleFormData.date}
                onChange={(e) => setSingleFormData({ ...singleFormData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift">Shift</Label>
              <Select 
                value={singleFormData.shift} 
                onValueChange={(value) => setSingleFormData({ ...singleFormData, shift: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      <span>1st</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="2nd">
                    <div className="flex items-center gap-2">
                      <Sunset className="h-4 w-4" />
                      <span>2nd</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSingleSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSingleSubmit} 
                disabled={isSingleSubmitting || !singleFormData.date || !singleFormData.shift}
                className="bg-[#5C8E77] hover:bg-[#4a7c65] text-white"
              >
                {isSingleSubmitting ? "Adding..." : "Add Schedule"}
              </Button>
            </div>
          </TabsContent>

          {/* Bulk Schedule Tab */}
          <TabsContent value="bulk" className="mt-4">
            <div className="space-y-6">
              {/* Date Range */}
              <div className="space-y-4">
                {/* <div>
                  <Label className="text-base font-semibold">Date Range</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select the start and end dates for your recurring schedule
                  </p>
                </div> */}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Days of Week */}
              <div className="space-y-3">
                {/* <div> */}
                  <Label className="text-base">Days of Week</Label>
                  {/* <p className="text-sm text-muted-foreground mb-3">
                    Select which days of the week you'll be available
                  </p> */}
                {/* </div> */}
                
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`
                        relative p-3 rounded-lg border-2 transition-all
                        ${selectedDays.includes(day.value)
                          ? "border-green-700"
                          : "border-gray-200 hover:border-green-700 bg-white"
                        }
                      `}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold">{day.short}</span>
                        {selectedDays.includes(day.value) && (
                          <CheckCircle2 className="h-4 w-4 text-green-700" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Shift Selection */}
              <div className="space-y-3">
                {/* <div> */}
                  <Label className="text-base font-semibold">Shift</Label>
                  {/* <p className="text-sm text-muted-foreground mb-3">
                    Select your preferred shift time
                  </p>
                </div> */}
                
                <div className="grid grid-cols-2 gap-3">
                  {SHIFTS.map((shift) => (
                    <button
                      key={shift.value}
                      type="button"
                      onClick={() => setSelectedShift(shift.value)}
                      className={`
                        p-4 rounded-lg border-2 transition-all text-left
                        ${selectedShift === shift.value
                          ? "border-green-700"
                          : "border-gray-200 hover:border-green-700 bg-white"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{shift.label}</span>
                        {selectedShift === shift.value && (
                          <CheckCircle2 className="h-5 w-5 text-green-700" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{shift.time}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {getExpectedCount() > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">Schedule Summary</span>
                  </div>
                  <p className="text-sm text-green-800">
                    This will create <strong>{getExpectedCount()}</strong>
                    {" "}schedule entries for the selected days between{" "}
                    <strong>{new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                    {" "}and{" "}
                    <strong>{new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isBulkSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!startDate || !endDate || selectedDays.length === 0 || !selectedShift || isBulkSubmitting}
                  onClick={handleBulkSubmit}
                  className="bg-[#5C8E77] hover:bg-[#4a7c65] text-white"
                >
                  {isBulkSubmitting ? "Creating..." : `Create ${getExpectedCount() > 0 ? `${getExpectedCount()} Schedules` : 'Schedules'}`}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}