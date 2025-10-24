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
    const { record_id, procedure_name, remarks, status, update_activity_status } = body

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
        remarks: remarks,
        status: status
      })
      .eq('rec_id', record_id)
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