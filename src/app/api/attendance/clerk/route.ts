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

    const allowedRoles = ['R02', 'R03']

    if (!allowedRoles.includes(userRole?.role)) {
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
      `)
    
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
      timeIn: new Date(record.created_at).toISOString().split('T')[1].split('.')[0],
      date: new Date(record.created_at).toISOString().split('T')[0],
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

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user has clerk role (R02)
    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()
    
    if (userRole?.role !== 'R02') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, request_id, status, sanitize } = body

    switch (action) {
      case 'confirm':
        // Update attendance status to confirmed
        const { data: confirmData, error: confirmError } = await supabase
          .from('request')
          .update({ 
            status: 'Confirmed',
            clerk_id: user.id,
            is_sanitized: true,
            updated_at: new Date().toISOString()
          })
          .eq('request_id', request_id)
          .select()

        if (confirmError) {
          return Response.json({ error: confirmError.message }, { status: 500 })
        }

        // Create audit log
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'confirm_attendance',
          table_name: 'request',
          record_id: request_id,
          old_values: { status: 'Pending' },
          new_values: { status: 'Confirmed', clerk_id: user.id },
          timestamp: new Date().toISOString()
        })

        return Response.json({ success: true, data: confirmData })

      case 'update_sanitize':
        // Update sanitization status
        const { data: sanitizeData, error: sanitizeError } = await supabase
          .from('request')
          .update({ 
            is_sanitized: sanitize === 'Yes',
            updated_at: new Date().toISOString()
          })
          .eq('request_id', request_id)
          .select()

        if (sanitizeError) {
          return Response.json({ error: sanitizeError.message }, { status: 500 })
        }

        // Create audit log
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'update_sanitization',
          table_name: 'request',
          record_id: request_id,
          new_values: { is_sanitized: sanitize === 'Yes' },
          timestamp: new Date().toISOString()
        })

        return Response.json({ success: true, data: sanitizeData })

      case 'delete':
        // Delete attendance record
        const { error: deleteError } = await supabase
          .from('request')
          .delete()
          .eq('request_id', request_id)

        if (deleteError) {
          return Response.json({ error: deleteError.message }, { status: 500 })
        }

        // Create audit log
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'delete_attendance',
          table_name: 'request',
          record_id: request_id,
          timestamp: new Date().toISOString()
        })

        return Response.json({ success: true })

      case 'timeout':
        // Record timeout
        const currentTime = new Date()
        const timeOut = currentTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })

        const { data: timeoutData, error: timeoutError } = await supabase
          .from('request')
          .update({ 
            time_out: timeOut,
            updated_at: new Date().toISOString()
          })
          .eq('request_id', request_id)
          .select()

        if (timeoutError) {
          return Response.json({ error: timeoutError.message }, { status: 500 })
        }

        // Create audit log
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'record_timeout',
          table_name: 'request',
          record_id: request_id,
          new_values: { time_out: timeOut },
          timestamp: new Date().toISOString()
        })

        return Response.json({ success: true, data: timeoutData })

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in POST /api/attendance/clerk:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}