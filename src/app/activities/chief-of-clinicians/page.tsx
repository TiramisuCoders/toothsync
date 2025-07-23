// app/admin/activities/page.tsx

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import ActivitiesPage from "./ActivitiesPage" // 👈 client component
import { supabase } from "@/lib/supabase"

export default async function AdminActivitiesPage() {
  // const supabase = createServerComponentClient({ cookies })

  // 1. Get current user session
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser()

  // if (!user) {
  //   redirect("/login") // redirect if not logged in
  // }

  // 2. Check user role from 'users' table (you can change table name)
  // const { data: profile, error: roleError } = await supabase
  //   .from("users")
  //   .select("role")
  //   .eq("id", user.id)s
  //   .single()

  // if (roleError || profile?.role !== "admin") {
  //   redirect("/not-authorized") // redirect if not an admin
  // }

  // 3. Fetch activities with joined tables
  const { data: activities, error: activityError } = await supabase
    .from("Activity_Records")
    .select(`
      record_id,
      clinician:clinician_id(
        first_name,
        last_name),
      chair:chair_id(
        chair_id),
      instructor:instructor_id(
        first_name,
        last_name),
      procedure:procedures(
        name),
      status,
      request:request_id(
        createdAt,
        patient_name)
    `)

  if (activityError) {
    console.error("Activity fetch error:", activityError.message)
    return <p className="text-red-500">Error loading activities.</p>
  }

  // return (
  //   <div className="p-6">
  //     <h1 className="text-2xl font-bold mb-4">All Activities</h1>
  //     {/* <ActivitiesPage data={activities} /> */}
  //     <ul className="space-y-2">
  //       {activities?.map((item, index) => {
  //         const formattedDate = item.request?.createdAt
  //           ? new Date(item.request.createdAt).toISOString().split("T")[0]
  //           : "No date"

  //         return (
  //           <li key={index} className="p-2 border rounded bg-gray-50">
  //             <p><strong>Status:</strong> {item.status}</p>
  //             <p><strong>Clinician:</strong> {item.clinician?.first_name} {item.clinician?.last_name}</p>
  //             <p><strong>Instructor:</strong> {item.instructor?.first_name} {item.instructor?.last_name}</p>
  //             <p><strong>Chair:</strong> {item.chair?.chair_id}</p>
  //             <p><strong>Procedure:</strong> {item.procedure?.name}</p>
  //             <p><strong>Requested Date:</strong> {formattedDate}</p>
  //           </li>
  //         )
  //       })}
  //     </ul>

  //   </div>
  // )
 const transformed = activities.map((item) => ({
    id: item.record_id,
    firstName: item.clinician?.first_name ?? "",
    lastName: item.clinician?.last_name ?? "",
    chair: item.chair?.chair_id ?? "",
    instructor: `${item.instructor?.first_name ?? ""} ${item.instructor?.last_name ?? ""}`,
    patient: item.request?.patient_name ?? "Unknown",
    procedure: item.procedure?.name ?? "Unknown",
    procedures: item.procedure ? [item.procedure.name] : [],
    status: item.status ?? "N/A",
    date: item.request?.createdAt
      ? new Date(item.request.createdAt).toISOString().split("T")[0]
      : "N/A",
  }))

  return <ActivitiesPage data={transformed} />
}
