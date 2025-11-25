// app/api/requests/route.ts
// WITH ACTIVITY LOGGING - Similar to academic-years API

import { NextRequest } from 'next/server'
import { createAuthenticatedSupabaseClient } from '@/lib/supabase-route'
import { logRequestApproved } from '@/app/utils/activityLogger'

export async function GET() {
  const supabase = await createAuthenticatedSupabaseClient()

  try {
    const { data, error: authError } = await supabase.auth.getUser()

    const user = data?.user
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    const allowedRoles = ['R02', 'R04']

    if (!allowedRoles.includes(userRole?.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch attendance records
    const { data: attendance, error:err } = await supabase
  .rpc('get_recent_attendance', { limit_count: 100 })


    console.log('- Attendance query result:', attendance)
    console.log('- Attendance query error:', err)

    if (err) {
      return Response.json({ error: "Database error", details: err.message }, { status: 500 })
    }

    // Transform data to match your interface
    const transformedData = attendance?.map(record => ({
      id: record.request_id,
      firstName: record.clinician_first_name || '',
      lastName: record.clinician_last_name || '',
      date: new Date(record.created_at).toISOString().split('T')[0],
      sanitize: record.is_sanitized ? 'Yes' : 'No',
      status: record.status || 'Pending'
    })) || []

    console.log(transformedData)

    return Response.json({
      success: true,
      data: transformedData,
      user_id: user.id
    })
  } catch (error) {
    console.error('Error in GET /api/requests:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createAuthenticatedSupabaseClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has clerk role (R02, R04)
    const { data: userRole } = await supabase
      .from('users')
      .select('role, email')
      .eq('auth_user_id', user.id)
      .single()

    const allowedRoles = ['R02', 'R04']

    if (!allowedRoles.includes(userRole?.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { request_id, record_id } = body

    if (!request_id && !record_id) {
      return Response.json({ error: "Missing request_id or record_id" }, { status: 400 })
    }

    // ========================================
    // GET CURRENT STATE BEFORE UPDATE
    // ========================================
    console.log('[v0] Fetching current request state:', request_id)
    const { data: currentRequest, error: fetchError } = await supabase
      .from('request')
      .select(`
        request_id,
        status,
        clinician_id,
        patient_name,
        is_sanitized
      `)
      .eq('request_id', request_id)
      .single()

    if (fetchError || !currentRequest) {
      console.error('[v0] Request not found:', request_id)
      return Response.json({ 
        error: 'Request not found',
        message: 'The requested record could not be found'
      }, { status: 404 })
    }

    const oldStatus = currentRequest.status
    console.log('[v0] Current status:', oldStatus)

    // ========================================
    // GET CLINICIAN INFO FOR LOGGING
    // ========================================
    const { data: clinicianData } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('auth_user_id', currentRequest.clinician_id)
      .single()

    const clinicianEmail = clinicianData?.email || 'unknown@example.com'
    const clinicianName = clinicianData ? `${clinicianData.first_name} ${clinicianData.last_name}` : 'Unknown'

    // ========================================
    // CALL EDGE FUNCTION
    // ========================================
    console.log('[v0] Calling edge function for resource matching')

    const edgeFunctionUrl = `${process.env.SUPABASE_URL}/functions/v1/resource-match`
    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        reqId: request_id,
        clerkId: user.id
      })
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        supabaseError: result.error || null,
        payload: result,
      }

      console.error('[v0] Edge function error:', errorDetails)

      // Return the edge function's message to the frontend
      return Response.json({
        error: 'Resource matching failed',
        message: result.message || 'Failed to find compatible resources',
        details: errorDetails,
        success: false
      }, { status: response.status || 400 })
    }

    // ========================================
    // GET UPDATED REQUEST TO CONFIRM STATUS CHANGE
    // ========================================
    const { data: updatedRequest } = await supabase
      .from('request')
      .select('status')
      .eq('request_id', request_id)
      .single()

    const newStatus = updatedRequest?.status || 'Confirmed'
    console.log('[v0] New status:', newStatus)

    // ========================================
    // LOG ACTIVITY - REQUEST APPROVED
    // ========================================
    if (oldStatus !== newStatus) {
      try {
        console.log('[v0] Logging request approval...')
        console.log('[v0] Old status:', oldStatus, '→ New status:', newStatus)

        const clientIp = request.headers.get('x-forwarded-for') ||
                        request.headers.get('x-real-ip') ||
                        undefined

        // Log the status change
        await logRequestApproved(
          user.id,
          userRole?.role,
          userRole?.email || 'unknown@example.com',
          clinicianEmail,
          request_id,
          clinicianName,
          currentRequest.patient_name,
          oldStatus,
          newStatus,
          clientIp
        )

        console.log(`[v0] ✅ Activity logged: Request ${request_id} status changed from ${oldStatus} to ${newStatus}`)
      } catch (logError) {
        console.error('[v0] Failed to log activity:', logError)
        // Don't fail the request if logging fails
      }
    }

    return Response.json({
      success: true,
      result: result,
      statusChanged: oldStatus !== newStatus,
      oldStatus,
      newStatus
    }, { status: 200 })

  } catch (error) {
    console.error('[v0] Error in POST /api/requests:', error)
    return Response.json({
      error: error.message || 'Failed to process confirmation',
      message: error.message || 'An unexpected error occurred',
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedSupabaseClient()  
    const { request_id } = await request.json()

    if (!request_id) {
      return Response.json({ error: 'Missing request_id' }, { status: 400 })
    }

    // Update the status instead of deleting the record
    const { error } = await supabase
      .from('request')
      .update({ status: 'Cancelled' }) // or 'cancel' depending on your schema
      .eq('request_id', request_id)

    if (error) {
      console.error('Supabase error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({
      message: 'Request status updated to Cancelled successfully.',
    })
  } catch (err) {
    console.error('Server error:', err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}