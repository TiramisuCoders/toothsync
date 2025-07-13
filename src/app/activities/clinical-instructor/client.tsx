"use client"

import { useEffect, useState } from "react"
import InstructorActivitiesContent from "./instructor-activities-content"

export default function InstructorActivitiesClient() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="bg-white border border-gray-200 shadow-sm mb-6 p-6 rounded-lg">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-[#333] mb-2">Loading Activities...</h2>
          <p className="text-gray-500">Please wait while we load your assigned activities.</p>
        </div>
      </div>
    )
  }

  return <InstructorActivitiesContent />
}