// api/activities/clinical-instructor/route.ts - UPDATED TO USE ap_id

import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from "@/lib/supabase-server";

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
    const { 
      activity_id,           // activities.record_id
      ap_id,                 // activity_procedures.ap_id (UUID) - CHANGED
      remarks, 
      status, 
      update_activity_status 
    } = body

    console.log('PATCH request body:', body)

    // If updating activity status (updates activities table)
    if (update_activity_status) {
      const { error: activityError } = await supabase
        .from('activities')
        .update({ status })
        .eq('record_id', activity_id)

      if (activityError) {
        console.error('Error updating activity status:', activityError)
        return Response.json({ error: 'Failed to update activity status' }, { status: 500 })
      }

      return Response.json({ success: true, message: 'Activity status updated' })
    }

    // Validate required fields for procedure update
    if (!ap_id) {
      console.error('Missing ap_id')
      return Response.json({ error: 'Missing ap_id (activity_procedures.ap_id)' }, { status: 400 })
    }

    console.log('Using ap_id:', ap_id)
    console.log('Updating with:', { remarks, status })

    // Update the activity_procedures table directly using ap_id
    const { data: updateData, error: updateError } = await supabase
      .from('activity_procedures')
      .update({
        remarks: remarks || "",
        status: status  
      })
      .eq('ap_id', ap_id)
      .select()  // Return the updated row for verification

    if (updateError) {
      console.error('Error updating procedure:', updateError)
      return Response.json({ 
        error: 'Failed to update procedure', 
        details: updateError.message 
      }, { status: 500 })
    }

    if (!updateData || updateData.length === 0) {
      console.error('No rows updated. ap_id may not exist:', ap_id)
      
      // Debug: Check if the record exists
      const { data: existingRecord } = await supabase
        .from('activity_procedures')
        .select('*')
        .eq('ap_id', ap_id)
        .single()
      
      console.error('Existing record check:', existingRecord)
      
      return Response.json({ 
        error: 'No procedure record found to update',
        debug: {
          ap_id,
          existing_record: existingRecord
        }
      }, { status: 404 })
    }

    console.log('Successfully updated procedure:', updateData)

    return Response.json({ 
      success: true, 
      message: 'Procedure updated successfully',
      data: {
        activity_id,
        ap_id,
        status,
        remarks,
        updated: updateData[0]
      }
    })

  } catch (error) {
    console.error('Error in PATCH /api/activities/clinical-instructor:', error)
    return Response.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}