"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sun, Sunset, Moon } from "lucide-react"

interface AddScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { date: string; shift: string }) => Promise<void>
}

export default function AddScheduleModal({ open, onOpenChange, onSubmit }: AddScheduleModalProps) {
  const [formData, setFormData] = useState({
    date: "",
    shift: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setFormData({
      date: "",
      shift: "",
    })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      resetForm()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    resetForm()
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Schedule</DialogTitle>
          <DialogDescription>Create a new schedule slot for clinical instruction</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              min={today}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shift">Shift</Label>
            <Select value={formData.shift} onValueChange={(value) => setFormData({ ...formData, shift: value })}>
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Schedule"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}