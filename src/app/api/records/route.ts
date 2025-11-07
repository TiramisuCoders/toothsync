// api/records/route.ts

import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const start = performance.now();
  const supabase = await createSupabaseServerClient()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userRole, error: roleError } = await supabase
      .from("users")
      .select("first_name, last_name, auth_user_id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (roleError || !userRole)
      return Response.json({ error: "User not found" }, { status: 404 });
        
    console.log('🔍 Fetching activity records with procedures, grades, and remarks...')

    const allowedRoles = ['R01', 'R03', 'R04'];
    if (!allowedRoles.includes(userRole.role)) {
      return Response.json({ error: 'Invalid role' }, { status: 403 });
    }

    console.log('🔍 Fetching activity records via RPC function...');

    // ✅ Call the database function with role-based filtering
    const { data: record, error: rpcError } = await supabase.rpc('get_activity_overview', {
      p_user_id: user.id,
      p_role: userRole.role
    });

    if (rpcError) {
      console.error('❌ RPC function failed:', rpcError);
      return Response.json({ 
        error: 'Database error', 
        details: rpcError.message 
      }, { status: 500 });
    }

    if (!record || record.length === 0) {
      console.log('ℹ️ No records found');
      return Response.json({ 
        success: true, 
        data: [],
        userRole: userRole.role,
        user_id: user.id 
      });
    }

    // Group records by activity_id (activities.record_id)
    const groupedByActivityId = record?.reduce((acc, r) => {
      // Use activity_id as the main grouping key
      if (!acc[r.activity_id]) {
        acc[r.activity_id] = {
          activity_id: r.activity_id,           // activities.record_id
          clinicianName: r.clinician,
          patientName: r.patient_name,
          patientType: r.patient_type,
          dateStarted: null,
          dateEnded: null,
          procedures: [],
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
      if (r.procedure_name && !acc[r.activity_id].procedures.includes(r.procedure_name)) {
        acc[r.activity_id].procedures.push(r.procedure_name);
      }
      
      // Find if this date already has a record entry
      let existingRecord = acc[r.activity_id].records.find((rec: any) => 
        rec.id === r.record_id &&  // Match by activity_records.id
        rec.date === formattedDate
      );
      
      if (existingRecord) {
        // Add procedure status to existing record
        existingRecord.procedureStatuses.push({
          ap_id: r.ap_id,                    // ADDED: Include ap_id
          procedure: r.procedure_name,
          status: r.status,
          remarks: r.remarks || "No remarks"
        });
      } else {
        // Create new record entry for this date/session
        acc[r.activity_id].records.push({
          id: r.record_id,  // This is activity_records.id (UUID)
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
            ap_id: r.ap_id,                  // ADDED: Include ap_id
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
        id: activity.activity_id,              // Use activity_id as the main ID
        activity_id: activity.activity_id,      // activities.record_id
        clinicianName: activity.clinicianName,
        patientName: activity.patientName,
        patientType: activity.patientType,
        dateStarted: activity.dateStarted,
        dateEnded: activity.dateEnded,
        // For table display (latest record data)
        date: latestRecord.date,
        timeIn: latestRecord.timeIn,
        timeOut: latestRecord.timeOut,
        instructorName: latestRecord.instructorName,
        chair: latestRecord.chair,
        status: latestRecord.procedureStatuses[0]?.status || "Unknown",
        procedures: activity.procedures,
        // For modal - includes activity_records.id and ap_id for each procedure
        allRecords: activity.records,
        recordCount: activity.records.length
      };
    });

    const end = performance.now();
    console.log(`⏰ API execution time: ${(end - start).toFixed(2)} ms`);

    console.log('✅ Final transformed records:', transformedRecords);
    
    return Response.json({ 
      success: true, 
      data: transformedRecords,
      userRole: userRole.role,
      user_id: user.id 
    })
    
  } catch (error) {
    console.error('Error in GET /api/records:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}