// api/activities/alinical-instructors/route.ts
// activities tab in instructor pov

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { headers, cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { createServerClient } from "@supabase/ssr";
import { createSupabaseServerClient } from "@/lib/supabase-server";
// import { createSupabaseRouteClient } from '@/lib/supabase-route';


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

    console.log('User role data:', userRole) // See what this returns
    console.log('Role value:', userRole?.role)
    console.log('Role type:', typeof userRole?.role)

    const allowedRoles = ['R01', 'R03', 'R04']

    if (!allowedRoles.includes(userRole?.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    console.log('🔍 Fetching attendance records...')

    // Fetch attendance records
   const { data: record, error: recordsErr } = await supabase
   .from("activity_records") 
   .select(`
      record_id,
      time_in,
      time_out,
      status,
      request:request_id (
        patient_name,
        clinician:clinician_id (
          auth_user_id,
          first_name,
          last_name
        )
      ),
      activity_procedures (
        procedure:procedure (
          name
        ),
        grade,
        remarks
      ),
      chair:chair_id (
        chair_name
      )
    `);

    console.log('- Attendance query result:', record)
    console.log('- Attendance query error:', recordsErr)

    if (recordsErr) {
      console.log('❌ Database query failed:', recordsErr.message)
      return Response.json({ error: 'Database error', details: recordsErr.message }, { status: 500 })
    }

    
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
    // Transform data to match your interface
      id: r.record_id,
      patientName: r.request?.patient_name,
      procedures: r.activity_procedures?.map(ap => ap.procedure?.name).filter(Boolean) || [],
      procedureDetails: procedureDetails,
      clinicianName: `${r.request?.clinician?.first_name|| ""} ${r.request?.clinician?.last_name || ""}`.trim(),
      date: new Date(r.time_in).toISOString().split('T')[0],
      timeIn: new Date(r.time_in).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      timeOut: r.time_out
      ? new Date(r.time_out).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "-",
      status: r.status,
      chair: r.chair?.chair_name,
    }

    return transformedRecord
    }) || []

    console.log(transformedRecords);
    
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


export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { data, error: authError } = await supabase.auth.getUser()
    
    const user = data?.user
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    const allowedRoles = ['R03']

    if (!allowedRoles.includes(userRole?.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { record_id, procedure_name, grade, remarks, status, update_activity_status } = body

    console.log('PATCH request body:', body)

    // If updating activity status
    if (update_activity_status) {
      const { error: activityError } = await supabase
        .from('activity_records')
        .update({ status })
        .eq('record_id', record_id)

      if (activityError) {
        console.error('Error updating activity status:', activityError)
        return Response.json({ error: 'Failed to update activity status' }, { status: 500 })
      }

      return Response.json({ success: true, message: 'Activity status updated' })
    }

    // Update procedure grade and remarks
    // First, get the procedure_id from the procedure name
    const { data: procedureData, error: procedureError } = await supabase
      .from('procedure')
      .select('procedure_id')
      .eq('name', procedure_name)
      .single()

    if (procedureError || !procedureData) {
      console.error('Error finding procedure:', procedureError)
      return Response.json({ error: 'Procedure not found' }, { status: 404 })
    }

    // Update the activity_procedures table
    const { error: updateError } = await supabase
      .from('activity_procedures')
      .update({
        grade: grade,
        remarks: remarks,
        status: status
      })
      .eq('record_id', record_id)
      .eq('procedure', procedureData.procedure_id)

    if (updateError) {
      console.error('Error updating procedure:', updateError)
      return Response.json({ error: 'Failed to update procedure' }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: 'Procedure updated successfully' 
    })

  } catch (error) {
    console.error('Error in PATCH /api/activities/clinical-instructor:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}