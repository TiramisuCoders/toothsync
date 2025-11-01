import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle2 } from "lucide-react"

interface BulkScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    startDate: string
    endDate: string
    daysOfWeek: number[]
    shift: string
  }) => void
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

export default function BulkScheduleModal({ open, onOpenChange, onSubmit }: BulkScheduleModalProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [selectedShift, setSelectedShift] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!startDate || !endDate || selectedDays.length === 0 || !selectedShift) {
      return
    }

    onSubmit({
      startDate,
      endDate,
      daysOfWeek: selectedDays,
      shift: selectedShift,
    })

    // Reset form
    setStartDate("")
    setEndDate("")
    setSelectedDays([])
    setSelectedShift("")
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Bulk Schedule Creation
          </DialogTitle>
          <DialogDescription>
            Create multiple schedule entries by selecting days of the week and a date range
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Range */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Date Range</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select the start and end dates for your recurring schedule
              </p>
            </div>
            
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
            <div>
              <Label className="text-base font-semibold">Days of Week</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select which days of the week you'll be available
              </p>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`
                    relative p-3 rounded-lg border-2 transition-all
                    ${selectedDays.includes(day.value)
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold">{day.short}</span>
                    {selectedDays.includes(day.value) && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Shift Selection */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold">Shift</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select your preferred shift time
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {SHIFTS.map((shift) => (
                <button
                  key={shift.value}
                  type="button"
                  onClick={() => setSelectedShift(shift.value)}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${selectedShift === shift.value
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{shift.label}</span>
                    {selectedShift === shift.value && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{shift.time}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {getExpectedCount() > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Schedule Summary</span>
              </div>
              <p className="text-sm text-blue-800">
                This will create <Badge variant="secondary" className="mx-1">{getExpectedCount()}</Badge> 
                schedule entries for the selected days between{" "}
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!startDate || !endDate || selectedDays.length === 0 || !selectedShift}
            >
              Create {getExpectedCount() > 0 && `${getExpectedCount()} Schedules`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}