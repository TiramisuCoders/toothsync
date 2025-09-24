// api/records/clinician/route.ts
// records tab - records
// kulang : instructor

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { headers, cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { createServerClient } from "@supabase/ssr";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { data, error: authError } = await supabase.auth.getUser()
    
    console.log('🔍 Auth Debug:')
    console.log('User ID:', data)
    console.log('Auth error:', authError)
    
    const user = data?.user
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    console.log('User role data:', userRole)
    console.log('Role value:', userRole?.role)
    console.log('Role type:', typeof userRole?.role)

    const allowedRoles = ['R01', 'R03']

    if (!allowedRoles.includes(userRole?.role)) {
      console.log('Role check failed:', userRole?.role, 'vs allowed roles')
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    console.log('🔍 Fetching activity records with procedures, grades, and remarks...')

    // Updated query to fetch complete data including grades and remarks
    const { data: record, error: recordsErr } = await supabase
      .from("activity_records")
      .select(`
        record_id,
        time_in,
        time_out,
        status,
        chair:chair_id (
          chair_name
        ),
        request:request_id (
          patient_name
        ),
        activity_procedures (
          procedure:procedure (
            name
          ),
          grade,
          remarks,
          status
        )
      `);
    // insert instructor

    console.log('- Activity records query result:', record)
    console.log('- Activity records query error:', recordsErr)

    if (recordsErr) {
      console.log('❌ Database query failed:', recordsErr.message)
      return Response.json({ error: 'Database error', details: recordsErr.message }, { status: 500 })
    }

    // Transform data to show individual procedures with their grades and remarks
    // const transformedRecords = record?.map(r => {
    //   // Get all procedure data with individual grades, remarks, and status
    //   const procedureDetails = r.activity_procedures?.map(ap => ({
    //     name: ap.procedure?.name,
    //     grade: ap.grade,
    //     remarks: ap.remarks,
    //     status: ap.status
    //   })).filter(p => p.name) || []

    //   console.log('proc details:', procedureDetails);

    //   return {
    //     id: r.record_id,
    //     patientName: r.request?.patient_name,
    //     procedures: procedureDetails.map(p => p.name), // Just names for table display
    //     procedureDetails: procedureDetails, // Complete procedure info for modal
    //     status: r.status,
    //     date: `${new Date(r.time_in).toISOString().split("T")[0]} ${r.time_in ?? ""} - ${r.time_out ?? ""}`,
        
    //     // These will be handled individually per procedure in the modal
    //     // grade: null,
    //     // remarks: null,
    //     // gradeStatus: null,
    //     instructor_full_name: r.instructors?.users 
    //       ? `${r.instructors.users.first_name} ${r.instructors.users.last_name}` 
    //       : null,
    //     chair: r.chair?.chair_name,
    //     status: r.request?.status,
    //     sanitize: r.is_sanitized ? "Yes" : "No",
    //   }
    // }) || []

    // console.log('Transformed records:', transformedRecords);
    
    
    // return Response.json({ 
    //   success: true, 
    //   data: transformedRecords,
    //   user_id: user.id 
    // })


     const transformedRecords = record?.map(r => {
      console.log('Processing record:', r.record_id, 'Activity procedures:', r.activity_procedures);
      
      // Get all procedure data with individual grades, remarks, and status
      const procedureDetails = r.activity_procedures?.map(ap => ({
        name: ap.procedure?.name,
        grade: ap.grade,
        remarks: ap.remarks,
        status: ap.status
      })).filter(p => p.name) || []

      console.log('proc details:', procedureDetails);

      const transformedRecord = {
        id: r.record_id,
        patientName: r.request?.patient_name,
        procedures: procedureDetails.map(p => p.name), // Just names for table display
        procedureDetails: procedureDetails, // Complete procedure info for modal
        status: r.status,
        // date: `${new Date(r.time_in).toISOString().split("T")[0]} ${r.time_in ?? ""} - ${r.time_out ?? ""}`,
        date: r.time_in
        ? new Date(r.time_in).toISOString().split("T")[0]
        : null,

        
        // These will be handled individually per procedure in the modal
        // grade: null,
        // remarks: null,
        // gradeStatus: null,
        instructor: null,
        chair: r.chair?.chair_name,
        sanitize: r.is_sanitized ? "Yes" : "No",
      }

      console.log('Transformed record for:', r.record_id, transformedRecord);
      
      return transformedRecord;
    }) || []

    console.log('Final transformed records:', transformedRecords);
    
    return Response.json({ 
      success: true, 
      data: transformedRecords,
      user_id: user.id 
    })
    
  } catch (error) {
    console.error('Error in GET /api/records/clinician:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}