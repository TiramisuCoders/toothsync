import InstructorActivitiesContent from "./instructor-activities-content"

export default function InstructorActivitiesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#333]">Activities & Grades Management</h1>
      <p className="text-[#666]">View, manage, and grade activities assigned to clinicians under your supervision.</p>
      <InstructorActivitiesContent />
    </div>
  )
}