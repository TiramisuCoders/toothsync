import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { data, error: authError } = await supabase.auth.getUser()
    
    const user = data?.user
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user role info
    const { data: userRole, error: roleError } = await supabase
      .from('users')
      .select('first_name, last_name, auth_user_id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (roleError || !userRole) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const startOfDay = `${today}T00:00:00.000Z`
    const endOfDay = `${today}T23:59:59.999Z`

    // Build base query - FIXED: Corrected all foreign key relationships
    let query = supabase
    .from("activity_records")
    .select(`
      record_id,
      time_in,
      time_out,
      id,
      instructor_id,
      chair_id,
      request_id,
      activities!activity_records_record_id_fkey(
        status
      ),
      instructors!activity_records_instructor_id_fkey(
        instructor_id,
        users!instructors_user_id_fkey(
          auth_user_id,
          first_name,
          last_name
        )
      ),
      chair!Activity_Records_chair_id_fkey(
        chair_name
      ),
      request!activity_records_request_id_fkey(
        patient_name,
        is_sanitized,
        shift,
        clinician_id,
        users!request_clinician_id_fkey(
          auth_user_id,
          first_name,
          last_name
        )
      ),
      activity_procedures(
        status,
        remarks,
        procedure(
          name
        )
      )
    `)
    .order("time_in", { ascending: false })
    .gte("time_in", startOfDay)
    .lte("time_in", endOfDay);  

    switch (userRole.role) {
      case 'R01': // Clinician - filter by clinician_id in request
        query = query.eq("request.clinician_id", userRole.auth_user_id);
        break

      case 'R02': // Clerk
        break

      case 'R03': // Instructor - filter by instructor_id
        const { data: instructorData } = await supabase
          .from("instructors")
          .select("instructor_id")
          .eq("user_id", userRole.auth_user_id)
          .single()
        
        if (instructorData) {
          query = query.eq("instructor_id", instructorData.instructor_id);
        }
        break

      case 'R04': // Admin
        break

      default:
        return Response.json({ error: 'Invalid role' }, { status: 403 })
    }

    const { data: records, error: recordsErr } = await query

    if (recordsErr) {
      console.error('Database query failed:', recordsErr)
      return Response.json({ 
        error: 'Database error', 
        details: recordsErr.message 
      }, { status: 500 })
    }

    const { count: todayCount } = await supabase
    .from("activity_records")
    .select("id, request!inner(clinician_id)", { count: "exact" })
    .gte("time_in", startOfDay)
    .lte("time_in", endOfDay)
    .eq("request.clinician_id", userRole.auth_user_id);

    const { count: todayTotalActivities1st } = await supabase
    .from("activity_records")
    .select("id, request!inner(shift)", { count: "exact" })
    .gte("time_in", startOfDay)
    .lte("time_in", endOfDay)
    .eq("request.shift", "1st");

    const { count: todayTotalActivities2nd } = await supabase
    .from("activity_records")
    .select("id, request!inner(shift)", { count: "exact" })
    .gte("time_in", startOfDay)
    .lte("time_in", endOfDay)
    .eq("request.shift", "2nd");

    const { count: availableChair1st, error: chairError1st } = await supabase
      .from("chair_availability")
      .select("chair_id", { count: "exact" })
      .gte("date", startOfDay)
      .lte("date", endOfDay)
      .eq("is_occupied", false)
      .eq("shift", "1st");

    if (chairError1st) {
      console.error("Chair count error:", chairError1st)
    }

    const { count: availableChair2nd, error: chairError2nd } = await supabase
      .from("chair_availability")
      .select("chair_id", { count: "exact" })
      .gte("date", startOfDay)
      .lte("date", endOfDay)
      .eq("is_occupied", false)
      .eq("shift", "2nd");

    if (chairError2nd) {
      console.error("Chair count error:", chairError2nd)
    }

    const { count: instructorsOnDuty1st, error: instructorError1st } = await supabase
      .from("instructors_availability_record")
      .select("instructor_id", { count: "exact" })
      .eq("date", today)
      .eq("shift", "1st");

    if (instructorError1st) {
      console.error("Instructor count error:", instructorError1st)
    }

    const { count: instructorsOnDuty2nd, error: instructorError2nd } = await supabase
      .from("instructors_availability_record")
      .select("instructor_id", { count: "exact" })
      .eq("date", today)
      .eq("shift", "2nd");

    if (instructorError2nd) {
      console.error("Instructor count error:", instructorError2nd)
    }

    const { count: request1st, error: requestErr1st } = await supabase
      .from("request")
      .select("request_id", { count: "exact" })
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay)
      .eq("shift", "1st")
      .eq("status", "Pending");

    if (requestErr1st) {
      console.error("Request count error:", requestErr1st)
    }

    const { count: request2nd, error: requestErr2nd } = await supabase
      .from("request")
      .select("request_id", { count: "exact" })
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay)
      .eq("shift", "2nd")
      .eq("status", "Confirmed");

    if (requestErr2nd) {
      console.error("Request count error:", requestErr2nd)
    }

    // Get instructor_id for filtering (only for instructors)
    const { data: currentInstructor } = await supabase
      .from("instructors")
      .select("instructor_id")
      .eq("user_id", userRole.auth_user_id)
      .maybeSingle()

    let assignedClinicians1st = null
    let assignedClinicians2nd = null
    let gradedClinicians = null
    let ungradedClinicians = null

    // Only fetch instructor-specific counts if user is an instructor
    if (currentInstructor?.instructor_id) {
      const { count: count1st, error: assignedCliniciansErr1st } = await supabase
        .from("activity_records")
        .select("id, request!inner(shift)", { count: "exact" })
        .gte("time_in", startOfDay)
        .lte("time_in", endOfDay)
        .eq("request.shift", "1st")
        .eq("instructor_id", currentInstructor.instructor_id);

      assignedClinicians1st = count1st

      if (assignedCliniciansErr1st) {
        console.error("Assigned Clinicians count error:", assignedCliniciansErr1st)
      }

      const { count: count2nd, error: assignedCliniciansErr2nd } = await supabase
        .from("activity_records")
        .select("id, request!inner(shift)", { count: "exact" })
        .gte("time_in", startOfDay)
        .lte("time_in", endOfDay)
        .eq("request.shift", "2nd")
        .eq("instructor_id", currentInstructor.instructor_id);

      assignedClinicians2nd = count2nd

      if (assignedCliniciansErr2nd) {
        console.error("Assigned Clinicians count error:", assignedCliniciansErr2nd)
      }

      const { count: countGraded, error: gradedCliniciansErr } = await supabase
        .from("activity_records")
        .select("id, activities!inner(status)", { count: "exact" })
        .gte("time_in", startOfDay)
        .lte("time_in", endOfDay)
        .eq("activities.status", "Completed")
        .eq("instructor_id", currentInstructor.instructor_id);

      gradedClinicians = countGraded

      if (gradedCliniciansErr) {
        console.error("Graded Clinicians count error:", gradedCliniciansErr)
      }

      const { count: countUngraded, error: ungradedCliniciansErr } = await supabase
        .from("activity_records")
        .select("id, activities!inner(status)", { count: "exact" })
        .gte("time_in", startOfDay)
        .lte("time_in", endOfDay)
        .eq("activities.status", "In Progress")
        .eq("instructor_id", currentInstructor.instructor_id);

      ungradedClinicians = countUngraded

      if (ungradedCliniciansErr) {
        console.error("Ungraded Clinicians count error:", ungradedCliniciansErr)
      }
    }

    const { data: clinicianDistribution, error: clinicianDistributionErr } = await supabase
      .from("instructors_availability_record")
      .select(`
        instructor_id,
        date,
        shift,
        assigned_clinicians,
        instructors(
          user_id,
          users!instructors_user_id_fkey(
            auth_user_id,
            first_name,
            last_name
          )
        )
      `)
      .eq("date", today)
      .order("shift", { ascending: true })
      .order("instructor_id", { ascending: true })

    if (clinicianDistributionErr) {
      console.error("Error fetching clinician distribution:", clinicianDistributionErr)
    }

    const transformedClinicianDistribution = clinicianDistribution?.map(item => ({
      instructor_id: item.instructor_id,
      instructor_name: `${item.instructors?.users?.first_name || ""} ${item.instructors?.users?.last_name || ""}`.trim(),
      date: item.date,
      shift: item.shift,
      assigned_clinicians: item.assigned_clinicians
    }))

    // Transform records for frontend
    const transformedRecords = records?.map(r => {
      const procedureDetails = r.activity_procedures?.map(ap => ({
        name: ap.procedure?.name,
        remarks: ap.remarks,
        status: ap.status
      })).filter(p => p.name) || []
      
      return {
        id: r.record_id,
        patientName: r.request?.patient_name,
        procedures: r.activity_procedures?.map(ap => ap.procedure?.name).filter(Boolean) || [],
        procedureDetails: procedureDetails,
        status: r.activities?.status,
        timeIn: r.time_in
          ? new Date(r.time_in).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
              timeZone: "Asia/Manila",
            })
          : null,
        timeOut: r.time_out
          ? new Date(r.time_out).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
              timeZone: "Asia/Manila",
            })
          : null,
        chair: r.chair?.chair_name,
        sanitized: r.request?.is_sanitized ? "Yes" : "No",

        // clinician details (from request table)
        clinicianId: r.request?.clinician_id,
        clinicianName: `${r.request?.users?.first_name || ""} ${r.request?.users?.last_name || ""}`.trim(),

        // instructor details
        instructorId: r.instructors?.users?.auth_user_id || null,
        instructorName: `${r.instructors?.users?.first_name || ""} ${r.instructors?.users?.last_name || ""}`.trim(),
      };
    }) || []
  
    return Response.json({ 
      success: true, 
      data: transformedRecords,
      distribution: transformedClinicianDistribution,
      todayCount,
      availableChair1st, 
      availableChair2nd,
      instructorsOnDuty1st,
      instructorsOnDuty2nd,
      assignedClinicians1st, 
      assignedClinicians2nd,
      gradedClinicians, 
      ungradedClinicians,
      todayTotalActivities1st,
      todayTotalActivities2nd,
      request1st,
      request2nd,
      user: {
        id: user.id,
        role: userRole.role,
        name: `${userRole.first_name} ${userRole.last_name}`
      },
    })
    
  } catch (error) {
    console.error('Error in GET /api/dashboard:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}