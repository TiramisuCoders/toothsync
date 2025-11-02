import { createAuthenticatedSupabaseClient } from '@/lib/supabase-route'

export async function GET() {
  const supabase = await createAuthenticatedSupabaseClient()

  try {

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      console.error("Authentication error:", userError)
      return { error: "User not authenticated", user: null, clinician: null }
    }

    // Fetch records from activity_overview that are "In Progress"
    const { data: records, error: recordsErr } = await supabase
      .from("activity_overview")
      .select("*")
      .eq("clinician_id", userData.user.id)
      .eq("status", "In Progress")
      .order("time_in", { ascending: false })

    if (recordsErr) {
      console.error('Database query failed:', recordsErr.message)
      return { 
        error: 'Database error', 
        details: recordsErr.message,
        data: null
      }
    }

    if (!records || records.length === 0) {
      return { 
        success: true, 
        data: [],
        error: null
      }
    }

    // Group records by record_id and organize procedures
    const groupedByActivityId = records.reduce((acc, r) => {
      if (!acc[r.activity_id]) {
        acc[r.activity_id] = {
          id: r.activity_id,
          clinicianName: r.clinician,
          patientName: r.patient_name,
          patientType: r.patient_type,
          dateStarted: null,
          dateEnded: null,
          procedures: [], // Unique list of procedure names
          records: []
        }
      }
      
      const formattedDate = r.time_in
        ? (() => {
            const d = new Date(r.time_in)
            const month = String(d.getMonth() + 1).padStart(2, "0")
            const day = String(d.getDate()).padStart(2, "0")
            const year = d.getFullYear()
            return `${month}-${day}-${year}`
          })()
        : null
      
      // Track unique procedures
      if (r.procedure_name && !acc[r.activity_id].procedures.includes(r.procedure_name)) {
        acc[r.activity_id].procedures.push(r.procedure_name)
      }
      
      // Find if this date already has a record entry
      let existingRecord = acc[r.activity_id].records.find((rec: any) => 
        rec.date === formattedDate && 
        rec.instructorName === r.instructor &&
        rec.chair === r.chair
      )
      
      if (existingRecord) {
        // Add procedure status to existing record
        existingRecord.procedureStatuses.push({
          procedure: r.procedure_name,
          status: r.status,
          remarks: r.remarks || "No remarks"
        })
      } else {
        // Create new record entry for this date/session
        acc[r.activity_id].records.push({
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
        })
      }
      
      return acc
    }, {} as any)

    // Convert to array and calculate date ranges
    const transformedRecords = Object.values(groupedByActivityId).map((activity: any) => {
      // Sort records by date descending (most recent first)
      activity.records.sort((a: any, b: any) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateB.getTime() - dateA.getTime()
      })
      
      // Set date started (earliest) and date ended (latest)
      if (activity.records.length > 0) {
        activity.dateStarted = activity.records[activity.records.length - 1].date
        activity.dateEnded = activity.records[0].date
      }
      
      const latestRecord = activity.records[0]
      
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
      }
    })

    console.log('Final transformed records:', transformedRecords)
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: transformedRecords,
      error: null
    }), { status: 200 })
    
  } catch (error) {
    console.error('Error in getInProgressActivities:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      data: null
    }), { status: 500 })
  }
}