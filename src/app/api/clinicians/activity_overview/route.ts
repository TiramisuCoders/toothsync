// api/clinicians/activity-overview/route.ts

import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const start = performance.now();
  const supabase = await createSupabaseServerClient();
  
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
        
    console.log('🔍 Fetching clinician activity overview...');

    const allowedRoles = ['R01', 'R03', 'R04'];
    if (!allowedRoles.includes(userRole.role)) {
      return Response.json({ error: 'Invalid role' }, { status: 403 });
    }

    // Fetch all data from the activity_overview view
    const { data: activities, error: viewError } = await supabase
      .from('activity_overview')
      .select('*')
      .order('clinician_id', { ascending: true })
      .order('academic_year_id', { ascending: false })
      .order('time_in', { ascending: false });

    if (viewError) {
      console.error('❌ View query failed:', viewError);
      return Response.json({ 
        error: 'Database error', 
        details: viewError.message 
      }, { status: 500 });
    }

    if (!activities || activities.length === 0) {
      console.log('ℹ️ No activities found');
      return Response.json({ 
        success: true, 
        data: [],
        userRole: userRole.role,
        user_id: user.id 
      });
    }

    // Group by clinician_id -> academic_year_id -> activity_id
    const groupedByClinician = activities.reduce((clinicians, row) => {
      const clinicianId = row.clinician_id;
      const academicYearId = row.academic_year_id;
      const activityId = row.activity_id;
      
      // Initialize clinician if not exists
      if (!clinicians[clinicianId]) {
        clinicians[clinicianId] = {
          clinician_id: clinicianId,
          clinician_name: row.clinician,
          academic_years: {}
        };
      }
      
      // Initialize academic year if not exists
      if (!clinicians[clinicianId].academic_years[academicYearId]) {
        clinicians[clinicianId].academic_years[academicYearId] = {
          academic_year_id: academicYearId,
          activities: {}
        };
      }
      
      // Initialize activity if not exists
      if (!clinicians[clinicianId].academic_years[academicYearId].activities[activityId]) {
        clinicians[clinicianId].academic_years[academicYearId].activities[activityId] = {
          activity_id: activityId,
          patientName: row.patient_name,
          patientType: row.patient_type,
          shift: row.shift,
          dateStarted: null,
          dateEnded: null,
          procedures: [],
          records: {}
        };
      }
      
      const activity = clinicians[clinicianId].academic_years[academicYearId].activities[activityId];
      
      // Format date
      const formattedDate = row.time_in
        ? (() => {
            const d = new Date(row.time_in);
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const year = d.getFullYear();
            return `${month}-${day}-${year}`;
          })()
        : null;
      
      // Track unique procedures for the activity
      if (row.procedure_name && !activity.procedures.includes(row.procedure_name)) {
        activity.procedures.push(row.procedure_name);
      }
      
      // Initialize record if not exists
      if (!activity.records[row.record_id]) {
        activity.records[row.record_id] = {
          id: row.record_id,
          date: formattedDate,
          timeIn: row.time_in
            ? new Date(row.time_in).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Manila"
              })
            : "-",
          timeOut: row.time_out
            ? new Date(row.time_out).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Manila"
              })
            : "-",
          instructorName: row.instructor || "N/A",
          instructorId: row.instructor_id || null,
          chair: row.chair || "N/A",
          clerkName: row.clerk || "N/A",
          clerkId: row.clerk_id || null,
          procedureStatuses: []
        };
      }
      
      // Add procedure status to the record
      if (row.procedure_name) {
        activity.records[row.record_id].procedureStatuses.push({
          ap_id: row.ap_id,
          procedure: row.procedure_name,
          status: row.status,
          remarks: row.remarks || "No remarks"
        });
      }
      
      return clinicians;
    }, {} as any);

    // Transform the nested structure into arrays and calculate date ranges
    const transformedData = Object.values(groupedByClinician).map((clinician: any) => {
      const academicYears = Object.values(clinician.academic_years).map((year: any) => {
        const activities = Object.values(year.activities).map((activity: any) => {
          // Convert records object to array and sort by date
          const recordsArray = Object.values(activity.records) as any[];
          recordsArray.sort((a: any, b: any) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
          });
          
          // Calculate date range for the activity
          if (recordsArray.length > 0) {
            activity.dateStarted = recordsArray[recordsArray.length - 1].date;
            activity.dateEnded = recordsArray[0].date;
          }
          
          const latestRecord = recordsArray[0];
          
          return {
            activity_id: activity.activity_id,
            patientName: activity.patientName,
            patientType: activity.patientType,
            shift: activity.shift,
            dateStarted: activity.dateStarted,
            dateEnded: activity.dateEnded,
            procedures: activity.procedures,
            recordCount: recordsArray.length,
            // Latest record info for table display
            latestDate: latestRecord.date,
            latestTimeIn: latestRecord.timeIn,
            latestTimeOut: latestRecord.timeOut,
            latestInstructor: latestRecord.instructorName,
            latestChair: latestRecord.chair,
            latestStatus: latestRecord.procedureStatuses[0]?.status || "Unknown",
            // All records for detailed view/modal
            allRecords: recordsArray
          };
        });
        
        return {
          academic_year_id: year.academic_year_id,
          activities: activities,
          activityCount: activities.length
        };
      });
      
      return {
        clinician_id: clinician.clinician_id,
        clinician_name: clinician.clinician_name,
        academic_years: academicYears,
        totalActivities: academicYears.reduce((sum: number, year: any) => 
          sum + year.activityCount, 0
        )
      };
    });

    const end = performance.now();
    console.log(`⏰ API execution time: ${(end - start).toFixed(2)} ms`);
    console.log(`✅ Processed ${transformedData.length} clinicians`);
    
    return Response.json({ 
      success: true, 
      data: transformedData,
      userRole: userRole.role,
      user_id: user.id,
      totalClinicians: transformedData.length
    });
    
  } catch (error) {
    console.error('Error in GET /api/clinicians/activity-overview:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Optional: GET by specific clinician ID
export async function POST(request: Request) {
  const start = performance.now();
  const supabase = await createSupabaseServerClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { clinician_id } = await request.json();
    
    if (!clinician_id) {
      return Response.json({ error: "clinician_id is required" }, { status: 400 });
    }

    console.log(`🔍 Fetching activities for clinician: ${clinician_id}`);

    // Fetch activities for specific clinician
    const { data: activities, error: viewError } = await supabase
      .from('activity_overview')
      .select('*')
      .eq('clinician_id', clinician_id)
      .order('academic_year_id', { ascending: false })
      .order('time_in', { ascending: false });

    if (viewError) {
      console.error('❌ View query failed:', viewError);
      return Response.json({ 
        error: 'Database error', 
        details: viewError.message 
      }, { status: 500 });
    }

    if (!activities || activities.length === 0) {
      return Response.json({ 
        success: true, 
        data: null,
        message: 'No activities found for this clinician'
      });
    }

    // Use same grouping logic but only for one clinician
    const academicYears = {};
    const clinicianName = activities[0].clinician;
    
    activities.forEach(row => {
      const academicYearId = row.academic_year_id;
      const activityId = row.activity_id;
      
      if (!academicYears[academicYearId]) {
        academicYears[academicYearId] = {
          academic_year_id: academicYearId,
          activities: {}
        };
      }
      
      if (!academicYears[academicYearId].activities[activityId]) {
        academicYears[academicYearId].activities[activityId] = {
          activity_id: activityId,
          patientName: row.patient_name,
          patientType: row.patient_type,
          shift: row.shift,
          dateStarted: null,
          dateEnded: null,
          procedures: [],
          records: {}
        };
      }
      
      const activity = academicYears[academicYearId].activities[activityId];
      
      const formattedDate = row.time_in
        ? (() => {
            const d = new Date(row.time_in);
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const year = d.getFullYear();
            return `${month}-${day}-${year}`;
          })()
        : null;
      
      if (row.procedure_name && !activity.procedures.includes(row.procedure_name)) {
        activity.procedures.push(row.procedure_name);
      }
      
      if (!activity.records[row.record_id]) {
        activity.records[row.record_id] = {
          id: row.record_id,
          date: formattedDate,
          timeIn: row.time_in
            ? new Date(row.time_in).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Manila"
              })
            : "-",
          timeOut: row.time_out
            ? new Date(row.time_out).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Manila"
              })
            : "-",
          instructorName: row.instructor || "N/A",
          instructorId: row.instructor_id || null,
          chair: row.chair || "N/A",
          clerkName: row.clerk || "N/A",
          clerkId: row.clerk_id || null,
          procedureStatuses: []
        };
      }
      
      if (row.procedure_name) {
        activity.records[row.record_id].procedureStatuses.push({
          ap_id: row.ap_id,
          procedure: row.procedure_name,
          status: row.status,
          remarks: row.remarks || "No remarks"
        });
      }
    });

    // Transform to array structure
    const transformedYears = Object.values(academicYears).map((year: any) => {
      const activities = Object.values(year.activities).map((activity: any) => {
        const recordsArray = Object.values(activity.records) as any[];
        recordsArray.sort((a: any, b: any) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });
        
        if (recordsArray.length > 0) {
          activity.dateStarted = recordsArray[recordsArray.length - 1].date;
          activity.dateEnded = recordsArray[0].date;
        }
        
        const latestRecord = recordsArray[0];
        
        return {
          activity_id: activity.activity_id,
          patientName: activity.patientName,
          patientType: activity.patientType,
          shift: activity.shift,
          dateStarted: activity.dateStarted,
          dateEnded: activity.dateEnded,
          procedures: activity.procedures,
          recordCount: recordsArray.length,
          latestDate: latestRecord.date,
          latestTimeIn: latestRecord.timeIn,
          latestTimeOut: latestRecord.timeOut,
          latestInstructor: latestRecord.instructorName,
          latestChair: latestRecord.chair,
          latestStatus: latestRecord.procedureStatuses[0]?.status || "Unknown",
          allRecords: recordsArray
        };
      });
      
      return {
        academic_year_id: year.academic_year_id,
        activities: activities,
        activityCount: activities.length
      };
    });

    const result = {
      clinician_id: clinician_id,
      clinician_name: clinicianName,
      academic_years: transformedYears,
      totalActivities: transformedYears.reduce((sum: number, year: any) => 
        sum + year.activityCount, 0
      )
    };

    const end = performance.now();
    console.log(`⏰ API execution time: ${(end - start).toFixed(2)} ms`);
    
    return Response.json({ 
      success: true, 
      data: result
    });
    
  } catch (error) {
    console.error('Error in POST /api/clinicians/activity-overview:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}