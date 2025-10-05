// api/dashboard/route.ts


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

    console.log('User id:', userRole.auth_user_id)
    console.log('User role:', userRole.role)

     // Apply role-based filters
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const startOfDay = `${today}T00:00:00.000Z`
    const endOfDay = `${today}T23:59:59.999Z`

    // Build base query
    let query = supabase
    .from("activity_records")
    .select(`
      record_id,
      time_in,
      time_out,
      status,
      instructor:instructor_id (
        user_id(
          auth_user_id,
          first_name,
          last_name
        )
      ),
      chair:chair_id (
        chair_name
      ),
      request:request_id (
        patient_name,
        clinician_id,
        is_sanitized,
        clinician:clinician_id (
          first_name,
          last_name
        )
      ),
      activity_procedures (
        grade,
        remarks,
        procedure:procedure (
          name
        )
      )
    `)
    .order("time_in", { ascending: false });
    // .gte("time_in", startOfDay)
    // .lte("time_in", endOfDay);  

    // const { data: recordsbeForeRoles, error: recordsError } = await query
    // console.log(recordsbeForeRoles)

    switch (userRole.role) {
      case 'R01': // Clinician
        query = query
          .eq("request.clinician_id", userRole.auth_user_id);
        break

      case 'R02': // Instructor
        break

      case 'R03': 
        // query = query
        //   .eq("instructor.user.auth_user_id", userRole.auth_user_id);
        break

      case 'R04': // Admin
        // No filters - they see all records
        break

      default:
        return Response.json({ error: 'Invalid role' }, { status: 403 })
    }

    const { data: records, error: recordsErr } = await query
    // console.log("With ROLEEEEEEEEEEEEEEEEEEEEEEEEEEES")
    // console.log(records)

    if (recordsErr) {
      console.error('Database query failed:', recordsErr)
      return Response.json({ 
        error: 'Database error', 
        details: recordsErr.message 
      }, { status: 500 })
    }

    const { count: todayCount } = await supabase
    .from("activity_records")
    .select("record_id, request!inner(clinician_id)", { count: "exact" })
    .gte("time_in", startOfDay.toString())
    .lte("time_in", endOfDay.toString())
    .eq("request.clinician_id", userRole.auth_user_id);

    const { count: todayTotalActivities1st } = await supabase
    .from("activity_records")
    .select("record_id", { count: "exact" })
    .gte("time_in", startOfDay.toString())
    .lte("time_in", endOfDay.toString());

    const { count: todayTotalActivities2nd } = await supabase
    .from("activity_records")
    .select("record_id", { count: "exact" })
    .gte("time_in", startOfDay.toString())
    .lte("time_in", endOfDay.toString());

    const { count: availableChair1st, error: chairError1st } = await supabase
      .from("chair_availability")
      .select("chair_id", { count: "exact" })
      .gte("date", startOfDay.toString())
      .lte("date", endOfDay.toString())
      .eq("is_occupied", false)
      .eq("shift", "1st");

    if (chairError1st) {
      console.error("Chair count error:", chairError1st)
    }

    const { count: availableChair2nd, error: chairError2nd } = await supabase
      .from("chair_availability")
      .select("chair_id", { count: "exact" })
      .gte("date", startOfDay.toString())
      .lte("date", endOfDay.toString())
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
      .gte("created_at", startOfDay.toString())
      .lte("created_at", endOfDay.toString())
      .eq("shift", "1st")
      .eq("status", "Confirmed");

    if (requestErr1st) {
      console.error("Instructor count error:", requestErr1st)
    }

    const { count: request2nd, error: requestErr2nd } = await supabase
      .from("request")
      .select("request_id", { count: "exact" })
      .gte("created_at", startOfDay.toString())
      .lte("created_at", endOfDay.toString())
      .eq("shift", "2nd")
      .eq("status", "Confirmed");

    if (requestErr2nd) {
      console.error("Instructor count error:", requestErr2nd)
    }

    const { count: assignedClinicians1st, error: assignedCliniciansErr1st } = await supabase
      .from("activity_records")
      .select("record_id, request!inner(shift), instructors!inner(user_id)", { count: "exact" })
      .gte("time_in", startOfDay.toString())
      .lte("time_in", endOfDay.toString())
      .eq("request.shift", "1st")
      .eq("instructors.user_id", userRole.auth_user_id);

    if (assignedCliniciansErr1st) {
      console.error("Assigned Clinicians count error:", assignedCliniciansErr1st)
    }

    const { count: assignedClinicians2nd, error: assignedCliniciansErr2nd } = await supabase
      .from("activity_records")
      .select("record_id, request!inner(shift), instructors!inner(user_id)", { count: "exact" })
      .gte("time_in", startOfDay.toString())
      .lte("time_in", endOfDay.toString())
      .eq("request.shift", "2nd")
      .eq("instructors.user_id", userRole.auth_user_id);



    if (assignedCliniciansErr2nd) {
      console.error("Assigned Clinicians count error:", assignedCliniciansErr2nd)
    }

    const { count: gradedClinicians, error: gradedCliniciansErr } = await supabase
      .from("activity_records")
      .select("record_id, request!inner(shift), instructors!inner(user_id)", { count: "exact" })
      .gte("time_in", startOfDay.toString())
      .lte("time_in", endOfDay.toString())
      .eq("status", "Completed"); // filter by shift in request


    if (gradedCliniciansErr) {
      console.error("Graded CLincians count error:", gradedCliniciansErr)
    }

    const { count: ungradedClinicians, error: ungradedCliniciansErr } = await supabase
      .from("activity_records")
      .select("record_id, request!inner(shift), instructors!inner(user_id)", { count: "exact" })
      .gte("time_in", startOfDay.toString())
      .lte("time_in", endOfDay.toString())
      .eq("status", "In Progress"); // filter by shift in request


    if (ungradedCliniciansErr) {
      console.error("Graded CLincians count error:", ungradedCliniciansErr)
    }

// CLINCIIAN DISTRIBUTION

  const { data:clinicianDistribution, error:clinicianDistributionErr } = await supabase
    .from("instructors_availability_record")
    .select(`
    instructor_id,
    date,
    shift,
    assigned_clinicians,
    instructors (
      user_id (
        auth_user_id,
        first_name,
        last_name
      )
    )
  `)
    .eq("date", new Date().toISOString().split("T")[0]) // today's date
    .order("shift", { ascending: true })
    .order("instructor_id", { ascending: true })

    if (clinicianDistributionErr) {
      console.error("Error fetching clinician distribution:", clinicianDistributionErr)
    } else {
      console.log("Clinician distribution:", data)
    }

    const transformedClinicianDistribution = clinicianDistribution?.map(item => ({
      instructor_id: item.instructor_id,
      instructor_name: `${item.instructors?.user_id?.first_name || ""} ${item.instructors?.user_id?.last_name || ""}`.trim(),
      date: item.date,
      shift: item.shift,
      assigned_clinicians: item.assigned_clinicians
    }))


    // Transform records for frontend
    const transformedRecords = records?.map(r => {
      const procedureDetails = r.activity_procedures?.map(ap => ({
        name: ap.procedure?.name,
        grade: ap.grade,
        remarks: ap.remarks,
        status: ap.status
      })).filter(p => p.name) || []


      // const grade = r.grades?.[0] // Assuming one grade per record
      
      return {
        id: r.record_id,
        patientName: r.request.patient_name,
        procedures: r.activity_procedures?.map(ap => ap.procedure?.name).filter(Boolean) || [],
        procedureDetails: procedureDetails,
        status: r.status,
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
        chair: r.chair.chair_name,
        sanitized: r.is_sanitized ? "Yes" : "No",
        gradeValue: r.grade || null,
        remarks: r.remarks || null,

        // clinician details
        clinicianId: r.request.clinician.auth_user_id,
        clinicianName: `${r.request.clinician.first_name || ""} ${r.request.clinician.last_name || ""}`.trim(),

        // instructor details
        instructorId: r.instructor?.user_id?.auth_user_id || null,
        instructorName: `${r.instructor?.user_id?.first_name || ""} ${r.instructor?.user_id?.last_name || ""}`.trim(),
      };
    }) || []
    
    // console.log(transformedRecords)
    console.log(todayCount,
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
    
    transformedClinicianDistribution)
  
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