"use client"

import dynamic from "next/dynamic"

// Simple loading component for server-side rendering
function LoadingActivities() {
  return (
    <div className="bg-white border border-gray-200 shadow-sm mb-6 p-6 rounded-lg">
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-[#333] mb-2">Loading Activities...</h2>
        <p className="text-gray-500">Please wait while we load your assigned activities.</p>
      </div>
    </div>
  )
}

// Dynamically import the actual component with SSR disabled
const InstructorActivitiesContent = dynamic(() => import("./instructor-activities-content"), {
  ssr: false,
  loading: () => <LoadingActivities />,
})

export default function InstructorActivitiesPage() {
  return <InstructorActivitiesContent />
}