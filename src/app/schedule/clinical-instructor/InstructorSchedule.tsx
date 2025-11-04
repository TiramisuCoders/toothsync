"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Plus, Trash2, Users, Sun, Sunset, Search, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import UnifiedScheduleModal from "@/components/modals/add-schedule-modal"

interface ScheduleRecord {
  id: string
  instructorId: string
  date: string
  shift: string
  assignedClinicians: number
}

export default function InstructorSchedulePage() {
  const [scheduleRecords, setScheduleRecords] = useState<ScheduleRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("this-week")
  const [customDateFilter, setCustomDateFilter] = useState({
    startDate: "",
    endDate: "",
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchScheduleRecords()
  }, [])

  const fetchScheduleRecords = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/schedule")
      const result = await response.json()

      if (result.success) {
        setScheduleRecords(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch schedule",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching schedule:", error)
      toast({
        title: "Error",
        description: "Failed to load schedule data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSingleSchedule = async (data: { date: string; shift: string }) => {
    if (!data.date || !data.shift) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      throw new Error("Validation failed")
    }

    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Schedule added successfully",
        })
        fetchScheduleRecords()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add schedule",
          variant: "destructive",
        })
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error adding schedule:", error)
      toast({
        title: "Error",
        description: "Failed to add schedule",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleBulkAddSchedule = async (data: {
    startDate: string
    endDate: string
    daysOfWeek: number[]
    shift: string
  }) => {
    try {
      const response = await fetch("/api/schedule/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: data.startDate,
          endDate: data.endDate,
          daysOfWeek: data.daysOfWeek,
          shift: data.shift,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || `Created ${result.created} schedules successfully`,
        })
        fetchScheduleRecords()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create schedules",
          variant: "destructive",
        })
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error creating bulk schedules:", error)
      toast({
        title: "Error",
        description: "Failed to create schedules",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) {
      return
    }

    try {
      const response = await fetch(`/api/schedule?id=${scheduleId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Schedule deleted successfully",
        })
        fetchScheduleRecords()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete schedule",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting schedule:", error)
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive",
      })
    }
  }

  const getShiftIcon = (shift: string) => {
    switch (shift) {
      case "Morning":
      case "1st":
        return <Sun className="h-4 w-4" />
      case "Afternoon":
      case "2nd":
        return <Sunset className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getShiftTime = (shift: string) => {
    switch (shift) {
      case "Morning":
      case "1st":
        return "8:00 AM - 12:00 PM"
      case "Afternoon":
      case "2nd":
        return "12:00 PM - 5:00 PM"
      default:
        return ""
    }
  }

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case "Morning":
      case "1st":
        return "bg-blue-100 text-blue-800"
      case "Afternoon":
      case "2nd":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getShiftLabel = (shift: string) => {
    switch (shift) {
      case "1st":
        return "1st Shift"
      case "2nd":
        return "2nd Shift"
      default:
        return shift
    }
  }

  const getWeekBounds = () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + diffToMonday)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    return { weekStart, weekEnd }
  }

  const filteredSchedules = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const { weekStart, weekEnd } = getWeekBounds()

    const thisWeek = scheduleRecords.filter((record) => {
      const recordDate = new Date(record.date)
      return recordDate >= weekStart && recordDate <= weekEnd
    })

    const upcoming = scheduleRecords.filter((record) => {
      const recordDate = new Date(record.date)
      return recordDate > weekEnd
    })

    const past = scheduleRecords.filter((record) => {
      const recordDate = new Date(record.date)
      return recordDate < weekStart
    })

    const custom = scheduleRecords.filter((record) => {
      if (!customDateFilter.startDate && !customDateFilter.endDate) return false

      const recordDate = new Date(record.date)
      const start = customDateFilter.startDate ? new Date(customDateFilter.startDate) : null
      const end = customDateFilter.endDate ? new Date(customDateFilter.endDate) : null

      if (start && end) {
        return recordDate >= start && recordDate <= end
      } else if (start) {
        return recordDate >= start
      } else if (end) {
        return recordDate <= end
      }
      return false
    })

    return {
      thisWeek: thisWeek.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      upcoming: upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      past: past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      custom: custom.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    }
  }, [scheduleRecords, customDateFilter])

  const applyCustomFilter = () => {
    if (customDateFilter.startDate || customDateFilter.endDate) {
      setActiveTab("custom")
      setIsFilterOpen(false)
    } else {
      toast({
        title: "Filter Required",
        description: "Please select at least one date",
        variant: "destructive",
      })
    }
  }

  const clearCustomFilter = () => {
    setCustomDateFilter({ startDate: "", endDate: "" })
    setActiveTab("this-week")
    setIsFilterOpen(false)
  }

  const renderScheduleCard = (record: ScheduleRecord) => (
    <div
      key={record.id}
      className="flex items-center justify-between p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
    >
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center bg-[#5C8E77] text-white px-3 py-2 rounded-md">
          <span className="text-2xl font-bold">{new Date(record.date).getDate()}</span>
          <span className="text-xs font-medium uppercase">
            {new Date(record.date).toLocaleDateString("en-US", { weekday: "short" })}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {getShiftIcon(record.shift)}
            <span className="font-semibold text-gray-900">{getShiftLabel(record.shift)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>
              {record.assignedClinicians} clinician{record.assignedClinicians !== 1 ? "s" : ""} assigned
            </span>
          </div>
        </div>
      </div>

      <Button
        size="sm"
        variant="ghost"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => handleDeleteSchedule(record.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )

  const renderScheduleList = (schedules: ScheduleRecord[], emptyMessage: string) => {
    if (schedules.length === 0) {
      return (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      )
    }

    return <div className="space-y-3">{schedules.map(renderScheduleCard)}</div>
  }

  const { weekStart, weekEnd } = getWeekBounds()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Schedule</h1>
        </div>
        <div className="flex gap-2">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="border-gray-300 text-gray-700 bg-transparent">
                <Filter className="h-4 w-4 mr-2" />
                Custom Date Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={customDateFilter.startDate}
                      onChange={(e) => setCustomDateFilter({ ...customDateFilter, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={customDateFilter.endDate}
                      onChange={(e) => setCustomDateFilter({ ...customDateFilter, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={clearCustomFilter}
                    className="flex-1 border-gray-300 bg-transparent"
                  >
                    Clear
                  </Button>
                  <Button onClick={applyCustomFilter} className="flex-1 bg-[#5C8E77] hover:bg-[#406E58] text-white">
                    <Search className="h-4 w-4 mr-2" />
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={() => setIsScheduleModalOpen(true)} className="bg-[#5C8E77] hover:bg-[#406E58] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </div>
      </div>

      <UnifiedScheduleModal
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        onSubmitSingle={handleAddSingleSchedule}
        onSubmitBulk={handleBulkAddSchedule}
      />

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">Loading schedule...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="this-week">
              This Week
              {filteredSchedules.thisWeek.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filteredSchedules.thisWeek.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming
              {filteredSchedules.upcoming.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filteredSchedules.upcoming.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past">
              Past
              {filteredSchedules.past.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filteredSchedules.past.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="custom" disabled={filteredSchedules.custom.length === 0}>
              Custom Filter
              {filteredSchedules.custom.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filteredSchedules.custom.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="this-week">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#5C8E77]">
                  <Calendar className="h-5 w-5" />
                  This Week
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                  {weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </CardDescription>
              </CardHeader>
              <CardContent>{renderScheduleList(filteredSchedules.thisWeek, "No schedules for this week")}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#5C8E77]">
                  <Calendar className="h-5 w-5" />
                  Upcoming Schedules
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Schedules after{" "}
                  {weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </CardDescription>
              </CardHeader>
              <CardContent>{renderScheduleList(filteredSchedules.upcoming, "No upcoming schedules")}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#5C8E77]">
                  <Calendar className="h-5 w-5" />
                  Past Schedules
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Schedules before{" "}
                  {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </CardDescription>
              </CardHeader>
              <CardContent>{renderScheduleList(filteredSchedules.past, "No past schedules")}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#5C8E77]">
                  <Search className="h-5 w-5" />
                  Custom Date Range
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {customDateFilter.startDate && customDateFilter.endDate
                    ? `${new Date(customDateFilter.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - ${new Date(customDateFilter.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : customDateFilter.startDate
                      ? `From ${new Date(customDateFilter.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                      : customDateFilter.endDate
                        ? `Until ${new Date(customDateFilter.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                        : "No date range selected"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderScheduleList(filteredSchedules.custom, "No schedules in the selected date range")}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
