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

    const allowedRoles = ['R01', 'R03']

    if (!allowedRoles.includes(userRole?.role)) {
      console.log('Role check failed:', userRole?.role, 'vs', 'R02')
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
        patient_name
      ),
      activity_procedures (
        procedure:procedure (
          name
        )
      )
    `);

    
    console.log('- Attendance query result:', record)
    console.log('- Attendance query error:', recordsErr)

    if (recordsErr) {
      console.log('❌ Database query failed:', recordsErr.message)
      return Response.json({ error: 'Database error', details: recordsErr.message }, { status: 500 })
    }

    // Transform data to match your interface
    const rec = record?.map(r => ({
      id: r.record_id,
      patientName: r.request?.patient_name,
      procedures: r.activity_procedures?.map(ap => ap.procedure?.name).filter(Boolean) || [],
      status: r.status,
       date: `${new Date(r.time_in).toISOString().split("T")[0]} ${r.time_in ?? ""} - ${r.time_out ?? ""}`
    })) || []

    console.log(rec);
    
    return Response.json({ 
      
      success: true, 
      data: rec,
      user_id: user.id 
    })
    
    } catch (error) {
        console.error('Error in GET /api/records/clinician:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  
}
