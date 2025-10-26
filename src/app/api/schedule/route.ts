// api/schedule/instructor/route.ts

import { createSupabaseServerClient } from "@/lib/supabase-server";

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
      .select('auth_user_id, role')
      .eq('auth_user_id', user.id)
      .single()

    console.log('User role data:', userRole)
    console.log('Role value:', userRole?.role)

    // Check if user is an instructor (adjust role codes as needed)
    const allowedRoles = ['R03', 'R04'] // Instructor roles
    if (!allowedRoles.includes(userRole?.role)) {
      console.log('Role check failed:', userRole?.role)
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    console.log('📅 Fetching instructor schedule records...')

    // Fetch schedule records for the instructor
    const { data: scheduleRecords, error: schedErr } = await supabase
      .from('instructors_availability_record')
      .select(`
    *,
    instructors!inner(
      user_id
    )
  `)
      .eq('instructors.user_id', userRole?.auth_user_id)
      .order('date', { ascending: true })

    console.log('- Schedule records query result:', scheduleRecords)
    console.log('- Schedule records query error:', schedErr)

    if (schedErr) {
      console.log('❌ Database query failed:', schedErr.message)
      return Response.json({ error: 'Database error', details: schedErr.message }, { status: 500 })
    }

    // Transform the records for frontend consumption
    const transformedRecords = scheduleRecords?.map(record => ({
      id: record.id,
      instructorId: record.instructor_id,
      date: record.date,
      shift: record.shift,
      assignedClinicians: record.assigned_clinicians || 0,
      status: new Date(record.date) < new Date() ? 'completed' : 'upcoming'
    })) || []

    console.log('✅ Transformed schedule records:', transformedRecords)
    
    return Response.json({ 
      success: true, 
      data: transformedRecords,
      user_id: user.id 
    })
    
  } catch (error) {
    console.error('Error in GET /api/schedule:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { data, error: authError } = await supabase.auth.getUser()
    const user = data?.user
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: userRole } = await supabase
      .from('users')
      .select('auth_user_id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (!userRole) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['R03', 'R04']
    if (!allowedRoles.includes(userRole?.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { date, shift } = body

    console.log('📝 Creating new schedule:', { date, shift })

    // Validate input
    if (!date || !shift) {
      return Response.json({ error: 'Date and shift are required' }, { status: 400 })
    }

    if (!['1st', '2nd'].includes(shift)) {
      return Response.json({ error: 'Invalid shift value' }, { status: 400 })
    }

    // Get instructor ID
    const { data: instructorUser, error: instructorError } = await supabase
      .from('instructors')
      .select('instructor_id')
      .eq('user_id', userRole.auth_user_id)
      .single()

    if (instructorError || !instructorUser) {
      console.error('Instructor lookup failed:', instructorError)
      return Response.json({ error: 'Instructor record not found' }, { status: 404 })
    }

    // Check for duplicate schedule
    const { data: existing, error: existingError } = await supabase
      .from('instructors_availability_record')
      .select('id')
      .eq('instructor_id', instructorUser.instructor_id)
      .eq('date', date)
      .eq('shift', shift) 

    if (existing) {
      return Response.json({ error: 'Schedule already exists for this date and shift' }, { status: 409 })
    }

    if (existingError) {
      console.error('Existing schedule check failed:', existingError)
    }

    // Insert new schedule
    const { data: newSchedule, error: insertError } = await supabase
      .from('instructors_availability_record')
      .insert({
        instructor_id: instructorUser.instructor_id,
        date,
        shift,
        assigned_clinicians: 0
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return Response.json({ error: 'Failed to create schedule', details: insertError.message }, { status: 500 })
    }

    console.log('✅ Schedule created:', newSchedule)

    return Response.json({ 
      success: true, 
      data: newSchedule 
    })
    
  } catch (error) {
    console.error('Error in POST /api/schedule:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { data, error: authError } = await supabase.auth.getUser()
    const user = data?.user
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: userRole } = await supabase
      .from('users')
      .select('auth_user_id, role')
      .eq('auth_user_id', user.id)
      .single()

    const allowedRoles = ['R03', 'R04']
    if (!allowedRoles.includes(userRole?.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('id')

    if (!scheduleId) {
      return Response.json({ error: 'Schedule ID is required' }, { status: 400 })
    }

    console.log('🗑️ Deleting schedule:', scheduleId)

    // Delete the schedule (only if it belongs to this instructor)
    const { error: deleteError } = await supabase
      .from('instructors_availability_record')
      .delete()
      .eq('id', scheduleId)
    //   .eq('instructor_id', userRole?.auth_user_id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return Response.json({ error: 'Failed to delete schedule', details: deleteError.message }, { status: 500 })
    }

    console.log('✅ Schedule deleted')

    return Response.json({ 
      success: true, 
      message: 'Schedule deleted successfully' 
    })
    
  } catch (error) {
    console.error('Error in DELETE /api/schedule:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}