// api/attendance/clerk/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { headers, cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { createServerClient } from "@supabase/ssr";
import { createSupabaseServerClient } from "@/lib/supabase-server";
// import { createSupabaseRouteClient } from '@/lib/supabase-route';


export async function GET() {

  const supabase = await createSupabaseServerClient()
  // const supabase = await createRouteHandlerClient({
  //   headers,
  //   cookies,
  // })

  
  // Debug what's in the supabase client
  // console.log('Supabase client:', Object.keys(supabase))
  // console.log('Has auth?:', 'auth' in supabase)
  // console.log('Auth methods:', supabase.auth ? Object.keys(supabase.auth) : 'no auth')
  
  // // Try different approaches
  // try {
  //   const result1 = await supabase.auth.getUser()
  //   console.log('Method 1 works:', result1)
  // } catch (e) {
  //   console.log('Method 1 failed:', e.message)
  // }
 
  
  try {
    // In your GET method, add console logs:
    // const { data: { user }, error } =  supabase.auth.getUser()
    // console.log('🔍 Debug Info:')
    // console.log('User ID:', user?.id)
    // console.log('User email:', user?.email)
    // console.log('Auth error:', error)

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

  
    if (userRole?.role !== 'R03') {
      console.log('Role check failed:', userRole?.role, 'vs', 'R02')
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    console.log("user is clerk")
    
    console.log('🔍 Fetching attendance records...')

    // Fetch attendance records
    const { data: attendance, error: err } = await supabase.from("request").select(`
        request_id,
        created_at,
        is_sanitized,
        status,
        clinician:clinician_id(
          first_name,
          last_name
        )
      `).eq("status", "Confirmed");
    
    console.log('- Attendance query result:', attendance)
    console.log('- Attendance query error:', err)

    if (err) {
      console.log('❌ Database query failed:', err.message)
      return Response.json({ error: 'Database error', details: err.message }, { status: 500 })
    }

    // Transform data to match your interface
    const transformedData = attendance?.map(record => ({
      id: record.request_id,
      firstName: record.clinician?.first_name || '',
      lastName: record.clinician?.last_name || '',
      // timeIn: record.time_in || '',
      // timeOut: record.time_out || '',
      date: new Date(record.created_at).toISOString().split('T')[0],
      time: new Date(record.created_at).toISOString().split('T')[1].split('.')[0],
      sanitize: record.is_sanitized ? "Yes" : "No",
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