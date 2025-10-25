// api/schedule/instructor/bulk/route.ts

import { createSupabaseServerClient } from "@/lib/supabase-server";

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

    const allowedRoles = ['R03', 'R04']
    if (!allowedRoles.includes(userRole?.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { startDate, endDate, daysOfWeek, shift } = body

    console.log('📅 Creating bulk schedule:', { startDate, endDate, daysOfWeek, shift })

    // Validate input
    if (!startDate || !endDate || !daysOfWeek || !shift) {
      return Response.json({ 
        error: 'Start date, end date, days of week, and shift are required' 
      }, { status: 400 })
    }

    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return Response.json({ 
        error: 'Days of week must be a non-empty array' 
      }, { status: 400 })
    }

    if (!['1st', '2nd'].includes(shift)) {
      return Response.json({ error: 'Invalid shift value' }, { status: 400 })
    }

    // Validate date range
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return Response.json({ error: 'Invalid date format' }, { status: 400 })
    }

    if (start > end) {
      return Response.json({ 
        error: 'Start date must be before or equal to end date' 
      }, { status: 400 })
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

    // Generate dates based on selected days of week
    const datesToSchedule: string[] = []
    const current = new Date(start)

    while (current <= end) {
      if (daysOfWeek.includes(current.getDay())) {
        // Format as YYYY-MM-DD
        const dateStr = current.toISOString().split('T')[0]
        datesToSchedule.push(dateStr)
      }
      current.setDate(current.getDate() + 1)
    }

    if (datesToSchedule.length === 0) {
      return Response.json({ 
        error: 'No dates match the selected days of week in the given range' 
      }, { status: 400 })
    }

    console.log(`📋 Generated ${datesToSchedule.length} dates to schedule`)

    // Check for existing schedules
    const { data: existingSchedules, error: existingError } = await supabase
      .from('instructors_availability_record')
      .select('date, shift')
      .eq('instructor_id', instructorUser.instructor_id)
      .eq('shift', shift)
      .in('date', datesToSchedule)

    if (existingError) {
      console.error('Error checking existing schedules:', existingError)
    }

    // Filter out dates that already have schedules
    const existingDates = new Set(
      existingSchedules?.map(s => s.date) || []
    )
    
    const newDates = datesToSchedule.filter(date => !existingDates.has(date))
    const skippedCount = datesToSchedule.length - newDates.length

    if (newDates.length === 0) {
      return Response.json({ 
        error: 'All selected dates already have schedules for this shift',
        skipped: skippedCount
      }, { status: 409 })
    }

    // Prepare bulk insert data
    const scheduleRecords = newDates.map(date => ({
      instructor_id: instructorUser.instructor_id,
      date,
      shift,
      assigned_clinicians: 0,
      updated_at: new Date().toISOString()
    }))

    // Bulk insert schedules
    const { data: newSchedules, error: insertError } = await supabase
      .from('instructors_availability_record')
      .insert(scheduleRecords)
      .select()

    if (insertError) {
      console.error('Bulk insert error:', insertError)
      return Response.json({ 
        error: 'Failed to create schedules', 
        details: insertError.message 
      }, { status: 500 })
    }

    console.log(`✅ Created ${newSchedules?.length || 0} schedule entries`)

    return Response.json({ 
      success: true, 
      data: newSchedules,
      created: newSchedules?.length || 0,
      skipped: skippedCount,
      message: skippedCount > 0 
        ? `Created ${newSchedules?.length} schedules. ${skippedCount} dates were skipped (already scheduled).`
        : `Successfully created ${newSchedules?.length} schedule entries.`
    })
    
  } catch (error) {
    console.error('Error in POST /api/schedule/bulk:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}