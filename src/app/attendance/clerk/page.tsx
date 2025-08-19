//attendance/clerk
//SSR

import ClerkAttendance from "./ClerkAttendance"
import { supabase } from "@/lib/supabase"
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createSupabaseServerClient } from "@/lib/supabase-server";


export default async function ClerkAttendancePage() {

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // console.log("SSR user:", user);

  // if USER is not CLERK
  // if (!user) {
  //   return <p className="text-red-500">Not authenticated</p>;
  // }

  //INSERT ORDER BY AND FILTER IT THAT ONLY DISPLAY THE ACTIVITIES TODAY
  // 
  // 
  // 
  // 
  // 
  // 
  const {data: attendance, error: attendanceError} = await supabase
  .from("request")
  .select(`
    request_id,
    created_at,
    is_sanitized,
    status,
    clinician:clinician_id(
      first_name,
      last_name
    )
  `);

   if (attendanceError) {
    console.error("Attendance fetch error:", attendanceError.message)
    return <p className="text-red-500">Error loading attendance.</p>
  }

  // console.log("Raw attendance data:", attendance)

  const formatted = attendance?.map((r) => ({
    id: r.request_id,
    firstName: r.clinician?.first_name ?? "",
    lastName: r.clinician?.last_name ?? "",
    timeIn: new Date(r.created_at).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    timeOut: "",
    date: new Date(r.created_at).toISOString().split("T")[0],
    sanitize: r.is_sanitized ? "Yes" : "No",
    status: r.status,
  }));

 
  return <ClerkAttendance data={formatted} />
  // (
  //   <div className="p-6 max-w-5xl mx-auto">
  //     <h1 className="text-2xl font-bold mb-4">Clerk Attendance Records</h1>
  //     <div className="grid grid-cols-1 gap-4">
  //       {formatted?.length === 0 && (
  //         <p className="text-gray-500">No attendance records found.</p>
  //       )}
  //       {formatted?.map((item) => (
  //         <div
  //           key={item.request_id}
  //           className="border p-4 rounded-md shadow-sm bg-white"
  //         >
  //           <p><span className="font-semibold">Request ID:</span> {item.request_id}</p>
  //           <p><span className="font-semibold">Clinician:</span> {item.clinician_name}</p>
  //           <p><span className="font-semibold">Date:</span> {item.created_date}</p>
  //           <p><span className="font-semibold">Time:</span> {item.created_time}</p>
  //           <p><span className="font-semibold">Status:</span> {item.status}</p>
  //           <p><span className="font-semibold">Sanitized:</span> {item.is_sanitized ? "Yes" : "No"}</p>
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // )

   
}