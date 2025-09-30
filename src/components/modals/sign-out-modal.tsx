"use client"

import { LogOut } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SignOutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function SignOutModal({ open, onOpenChange, onConfirm }: SignOutModalProps) {
  const handleSignOut = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign Out</DialogTitle>
          <DialogDescription>
            Are you sure you want to sign out? You'll need to sign in again to access your account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        <Button
        variant="destructive"
        onClick={handleSignOut}
        className="text-white hover:text-white"
        >
        <LogOut className="mr-2 h-4 w-4 text-white" />
        Sign Out
        </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
