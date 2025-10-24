// api/records/clinician/route.ts
// records tab - records
// kulang : instructor

import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { data, error: authError } = await supabase.auth.getUser()
        
    const user = data?.user
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRole, error: roleError } = await supabase
      .from('users')
      .select('first_name, last_name, auth_user_id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (roleError || !userRole) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }
        
    console.log('🔍 Fetching activity records with procedures, grades, and remarks...')

    let query = supabase
      .from("activity_overview")
      .select(`
        *
      `)
      .order("time_in", { ascending: false });

      switch (userRole.role) {
      case 'R01': // Clinician
        query = query
          .eq("clinician_id", user.id);
        break

      case 'R03':
        break

      case 'R04': // Admin
        break

      default:
        return Response.json({ error: 'Invalid role' }, { status: 403 })
    }

    const { data: record, error: recordsErr } = await query
    // filter student records like eq(clincian_id, user id)

    console.log('- Activity records query result:', record)

    if (recordsErr) {
      console.log('❌ Database query failed:', recordsErr.message)
      return Response.json({ 
        error: 'Database error', 
        details: recordsErr.message 
      }, { status: 500 })
    }

  // Group records by record_id and organize procedures
  const groupedByActivityId = record?.reduce((acc, r) => {
    if (!acc[r.record_id]) {
      acc[r.record_id] = {
        id: r.record_id,
        clinicianName: r.clinician,
        patientName: r.patient_name,
        patientType: r.patient_type,
        dateStarted: null,
        dateEnded: null,
        procedures: [], // Unique list of procedures
        records: []
      };
    }
    
    const formattedDate = r.time_in
      ? (() => {
          const d = new Date(r.time_in)
          const month = String(d.getMonth() + 1).padStart(2, "0")
          const day = String(d.getDate()).padStart(2, "0")
          const year = d.getFullYear()
          return `${month}-${day}-${year}`
        })()
      : null;
    
    // Track unique procedures
    if (r.procedure_name && !acc[r.record_id].procedures.includes(r.procedure_name)) {
      acc[r.record_id].procedures.push(r.procedure_name);
    }
    
    // Find if this date already has a record entry
    let existingRecord = acc[r.record_id].records.find((rec: any) => 
      rec.date === formattedDate && 
      rec.instructorName === r.instructor &&
      rec.chair === r.chair
    );
    
    if (existingRecord) {
      // Add procedure status to existing record
      existingRecord.procedureStatuses.push({
        procedure: r.procedure_name,
        status: r.status,
        remarks: r.remarks || "No remarks"
      });
    } else {
      // Create new record entry for this date/session
      acc[r.record_id].records.push({
        date: formattedDate,
        timeIn: new Date(r.time_in).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Manila"
        }),
        timeOut: r.time_out
          ? new Date(r.time_out).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
              timeZone: "Asia/Manila"
            })
          : "-",
        instructorName: r.instructor || "N/A",
        chair: r.chair || "N/A",
        procedureStatuses: [{
          procedure: r.procedure_name,
          status: r.status,
          remarks: r.remarks || "No remarks"
        }]
      });
    }
    
    return acc;
  }, {} as any);

// Convert to array and calculate date ranges
  const transformedRecords = Object.values(groupedByActivityId).map((activity: any) => {
    // Sort records by date descending (most recent first)
    activity.records.sort((a: any, b: any) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Set date started (earliest) and date ended (latest)
    if (activity.records.length > 0) {
      activity.dateStarted = activity.records[activity.records.length - 1].date;
      activity.dateEnded = activity.records[0].date;
    }
    
    const latestRecord = activity.records[0];
    
    return {
      id: activity.id,
      clinicianName: activity.clinicianName,
      patientName: activity.patientName,
      patientType: activity.patientType,
      dateStarted: activity.dateStarted,
      dateEnded: activity.dateEnded,
      // For table display
      date: latestRecord.date,
      timeIn: latestRecord.timeIn,
      timeOut: latestRecord.timeOut,
      instructorName: latestRecord.instructorName,
      chair: latestRecord.chair,
      status: latestRecord.procedureStatuses[0]?.status || "Unknown",
      procedures: activity.procedures,
      // For modal
      allRecords: activity.records,
      recordCount: activity.records.length
    };
  });

    console.log('Final transformed records:', transformedRecords);
    
    return Response.json({ 
      success: true, 
      data: transformedRecords,
      userRole: userRole.role,
      user_id: user.id 
    })
    
  } catch (error) {
    console.error('Error in GET /api/records/clinician:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

