// app/api/form/submitted-requests/route.ts

import { NextRequest } from 'next/server'
import { createAuthenticatedSupabaseClient } from '@/lib/supabase-route'

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

    const allowedRoles = ['R01']

    if (!allowedRoles.includes(userRole?.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch submitted requests
    const { data: requests, error: err } = await supabase
        .rpc('get_submitted_request', { p_user_id: user.id, limit_count: 100 })

    console.log('- Requests query result:', requests)
    console.log('- Requests query error:', err)

    if (err) {
      return Response.json({ error: "Database error", details: err.message }, { status: 500 })
    }

    // Group by request_id to aggregate procedures
    const groupedMap = new Map()

    requests?.forEach(record => {
      const requestId = record.request_id
      
      if (!groupedMap.has(requestId)) {
        // Initialize new request entry
        groupedMap.set(requestId, {
          id: record.request_id,
          patientName: record.patient_name || '',
          patientType: record.patient_type || '',
          status: record.status || 'Pending',
          shift: record.shift || '',
          createdAt: record.created_at,
          isSanitized: record.is_sanitized || false,
          procedures: [],
          procedureIds: new Set(), // Use Set to avoid duplicates
          date: '',
          timeIn: '',
          recordCount: 1,
          allRecords: []
        })
      }

      // Add procedure if it exists and isn't null
      const request = groupedMap.get(requestId)
      if (record.procedure_id && !request.procedureIds.has(record.procedure_id)) {
        request.procedureIds.add(record.procedure_name)
        request.procedures.push(record.procedure_name)
      }
    })

    // Convert Map to Array and format dates
    const transformedData = Array.from(groupedMap.values()).map(request => {
      // Format date and time
      const createdDate = new Date(request.createdAt)
      const befereDate = createdDate.toISOString().split('T')[0]; // "2025-11-10"
      const [year, month, day] = befereDate.split('-');
      const date = `${month}-${day}-${year}`; // "11-10-2025"

      const timeIn = createdDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })

      // Remove the Set (procedureIds) from final output
      const { procedureIds, ...rest } = request

      return {
        ...rest,
        date,
        timeIn
      }
    })

    // Sort by created date descending (newest first)
    transformedData.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    console.log('- Transformed data:', transformedData)

    return Response.json({
      success: true,
      data: transformedData,
      user_id: user.id
    })
  } catch (error) {
    console.error('Error in GET /api/form/submitted-requests:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}


export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedSupabaseClient();
    const { request_id } = await request.json();

    if (!request_id) {
      return Response.json({ error: 'Missing request_id' }, { status: 400 });
    }

    // Get Philippine time (UTC+8)
    const philippineTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Manila",
    });
    const formattedTime = new Date(philippineTime).toISOString();

    // Update both status and updated_at
    const { error } = await supabase
      .from("request")
      .update({
        status: "Cancelled",
        updated_at: formattedTime,
      })
      .eq("request_id", request_id);

    if (error) {
      console.error("Supabase error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      message: "Request status updated to Cancelled successfully.",
    });
  } catch (err) {
    console.error("Server error:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
