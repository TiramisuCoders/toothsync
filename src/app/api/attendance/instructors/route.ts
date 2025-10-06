// api/attendance/clerk/route.ts
// double with activities / clinical - instructor

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
    
    const user = data?.user
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    // console.log('User role data:', userRole) // See what this returns
    // console.log('Role value:', userRole?.role)
    // console.log('Role type:', typeof userRole?.role)

  
    if (userRole?.role !== 'R03'|| userRole?.role !== 'R04') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // console.log("user is clerk")
    
    // console.log('🔍 Fetching attendance records...')

    // Fetch attendance records
    const { data: attendance, error: err } = await supabase.from("activity_records").select(`
        record_id,
        time_in,
        time_out,
        status,
        request:request_id(
          is_sanitized,
            clinician:clinician_id(
            first_name,
            last_name
            )
        )
      `).order("time_in", { ascending: false })
    
    console.log('- Attendance query result:', attendance)
    console.log('- Attendance query error:', err)

    if (err) {
      console.log('❌ Database query failed:', err.message)
      return Response.json({ error: 'Database error', details: err.message }, { status: 500 })
    }

   const transformedData = attendance?.map(record => ({
      id: record.record_id,
      firstName: record.request?.clinician?.first_name || '',
      lastName: record.request?.clinician?.last_name || '',
      clinicianName: `${record.request?.clinician?.first_name|| ""} ${record.request?.clinician?.last_name || ""}`.trim(),
      date: new Date(record.time_in).toISOString().split('T')[0],
      timeIn: new Date(record.time_in).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      timeOut: record.time_out
      ? new Date(record.time_out).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "-",

      sanitize: record.request?.is_sanitized ? "Yes" : "No",
      status: record.status || "Pending"
    })) || []


    console.log(transformedData);
    
    return Response.json({ 
      
      success: true, 
      data: transformedData,
      user_id: user.id 
    })
    
  } catch (error) {
    console.error('Error in GET /api/attendance/clerk:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}