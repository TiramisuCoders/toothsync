// api/records/clinician/route.ts
// records tab - attendance

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

    const allowedRoles = ['R01', 'R02']

    if (!allowedRoles.includes(userRole?.role)) {
      console.log('Role check failed:', userRole?.role, 'vs', 'R02')
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    console.log("user is clinician or clerk")
    
    console.log('🔍 Fetching attendance records...')

    // Fetch attendance records
   const { data: record, error: recordsErr } = await supabase
    .from("activity_records")
    .select(`
      record_id,
      time_in,
      time_out,
      chair:chair_id (
        chair_name
      ),      
      request:request_id (
        status,
        is_sanitized
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
      timeIn: r.time_in,
      timeOut: r.time_out,
      chair: r.chair?.chair_name,
      procedures: r.activity_procedures?.map(ap => ap.procedure?.name).filter(Boolean) || [],
      status: r.request?.status,
      sanitize: r.is_sanitized ? "Yes" : "No",
    })) || []

    console.log(rec);
    
    return Response.json({ 
      
      success: true, 
      data: rec,
      user_id: user.id 
    })
    
    } catch (error) {
        console.error('Error in GET /api/attendance/clinician:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  
}
