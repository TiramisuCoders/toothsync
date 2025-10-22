// api/dental-chairs/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

// GET /api/dental-chairs - Fetch all chairs with procedures and status for both shifts
export async function GET() {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { data, error: authError } = await supabase.auth.getUser()
    
    console.log('🔍 Auth Debug:')
    console.log('User ID:', data)
    console.log('Auth error:', authError)
    
    const user = data?.user
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    console.log('User role data:', userRole)
    
    console.log('🔍 Fetching chair data with procedures and status for both shifts...')

    // Fetch all chairs with their basic info
    const { data: chairs, error: chairError } = await supabase
      .from('chair')
      .select('chair_id, chair_name, is_active')
      .order('chair_id')

    if (chairError) {
      console.log('❌ Chair query failed:', chairError.message)
      return NextResponse.json({ error: 'Database error', details: chairError.message }, { status: 500 })
    }

    // Fetch all chair procedures
    const { data: chairProcedures, error: proceduresError } = await supabase
      .from('chair_procedures')
      .select(`
        chair_id,
        department:department_id(
          id,
          name
        )
      `)

    if (proceduresError) {
      console.log('❌ Procedures query failed:', proceduresError.message)
      return NextResponse.json({ error: 'Database error', details: proceduresError.message }, { status: 500 })
    }

    // Fetch chair availability for today for BOTH shifts
    const today = new Date().toISOString().split('T')[0]
    const { data: chairAvailability, error: availabilityError } = await supabase
      .from('chair_availability')
      .select('chair_id, shift, is_occupied')
      .eq("date", today)

      // .gte('date', `${today}T00:00:00`)
      // .lt('date', `${today}T23:59:59`)

    if (availabilityError) {
      console.log('❌ Availability query failed:', availabilityError.message)
      // Don't fail the request, just log the error
    }

    console.log('Chair availability data:', chairAvailability)

    // Create maps for easier lookup
    const proceduresByChair = new Map()
    chairProcedures?.forEach((cp: any) => {
      if (!proceduresByChair.has(cp.chair_id)) {
        proceduresByChair.set(cp.chair_id, [])
      }
      if (cp.department) {
        proceduresByChair.get(cp.chair_id).push(cp.department.name)
      }
    })

    // Create separate maps for shift 1 and shift 2 occupancy
    const shift1OccupancyByChair = new Map()
    const shift2OccupancyByChair = new Map()
    
    chairAvailability?.forEach((ca: any) => {
      if (ca.shift === '1st') {
        shift1OccupancyByChair.set(ca.chair_id, ca.is_occupied)
      } else if (ca.shift === '2nd') {
        shift2OccupancyByChair.set(ca.chair_id, ca.is_occupied)
      }
    })

    // Transform data to match your interface
    const transformedData = chairs?.map(chair => {
      const procedures = proceduresByChair.get(chair.chair_id) || []
      const shift1Occupied = shift1OccupancyByChair.get(chair.chair_id) || false
      const shift2Occupied = shift2OccupancyByChair.get(chair.chair_id) || false
      
      // Determine status for each shift
      let shift1Status: "Available" | "Occupied" | "Under Maintenance"
      let shift2Status: "Available" | "Occupied" | "Under Maintenance"
      let overallStatus: "Available" | "Occupied" | "Under Maintenance"
      
      if (!chair.is_active) {
        shift1Status = "Under Maintenance"
        shift2Status = "Under Maintenance"
        overallStatus = "Under Maintenance"
      } else {
        // Shift 1 status
        shift1Status = shift1Occupied ? "Occupied" : "Available"
        
        // Shift 2 status
        shift2Status = shift2Occupied ? "Occupied" : "Available"
        
        // Overall status: if any shift is occupied, mark as occupied
        if (shift1Occupied || shift2Occupied) {
          overallStatus = "Occupied"
        } else {
          overallStatus = "Available"
        }
      }
      
      return {
        id: chair.chair_id.toString(),
        chair_name: chair.chair_name,
        procedures: procedures,
        status: overallStatus,
        shift1_status: shift1Status,
        shift2_status: shift2Status
      }
    }) || []

    console.log('Transformed data with shifts:', transformedData)
    
    return NextResponse.json({ 
      success: true, 
      data: transformedData,
      user_id: user.id 
    })
    
  } catch (error) {
    console.error('Error in GET /api/dental-chairs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/dental-chairs - Update chair status and procedures
export async function PUT(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { data, error: authError } = await supabase.auth.getUser()
    
    const user = data?.user
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chairId, status, procedures, shift } = await req.json()

    if (!chairId) {
      return NextResponse.json({ error: 'Chair ID is required' }, { status: 400 })
    }

    console.log('🔄 Updating chair:', chairId, 'Status:', status, 'Shift:', shift, 'Procedures:', procedures)

    // Start a transaction-like approach
    
    // 1. Update chair status (is_active) - this affects both shifts
    const isActive = status !== "Under Maintenance"
    const { error: chairUpdateError } = await supabase
      .from('chair')
      .update({ is_active: isActive })
      .eq('chair_id', parseInt(chairId))

    if (chairUpdateError) {
      console.error('Error updating chair status:', chairUpdateError)
      return NextResponse.json({ error: 'Failed to update chair status' }, { status: 500 })
    }

    // 2. Update chair availability for the specified shift (or both if no shift specified)
    const today = new Date().toISOString().split('T')[0]
    const isOccupied = status === "Occupied"
    
    // Determine which shifts to update
    const shiftsToUpdate = shift ? [shift] : ['1st', '2nd']
    
    for (const currentShift of shiftsToUpdate) {
      // Check if availability record exists for this shift today
      const { data: existingAvailability } = await supabase
        .from('chair_availability')
        .select('chair_id')
        .eq('chair_id', chairId)
        .eq('date', today)
        .eq('shift', currentShift)
        .single()

      if (existingAvailability) {
        // Update existing record
        const { error: availabilityUpdateError } = await supabase
          .from('chair_availability')
          .update({ is_occupied: isOccupied })
          .eq('chair_id', chairId)
          .eq('date', today)
          .eq('shift', currentShift)

        if (availabilityUpdateError) {
          console.error(`Error updating chair availability for ${currentShift}:`, availabilityUpdateError)
        }
      } else {
        // Create new availability record
        const { error: availabilityInsertError } = await supabase
          .from('chair_availability')
          .insert({
            chair_id: chairId,
            date: today,
            shift: currentShift,
            is_occupied: isOccupied
          })

        if (availabilityInsertError) {
          console.error(`Error inserting chair availability for ${currentShift}:`, availabilityInsertError)
        }
      }
    }

    // 3. Update procedures if provided
    if (procedures && Array.isArray(procedures)) {
      // First, get all procedure IDs for the given procedure names
      const { data: procedureData, error: procedureError } = await supabase
        .from('procedure')
        .select('procedure_id, name')
        .in('name', procedures)

      if (procedureError) {
        console.error('Error fetching procedures:', procedureError)
        return NextResponse.json({ error: 'Failed to fetch procedures' }, { status: 500 })
      }

      // Delete existing chair procedures
      const { error: deleteError } = await supabase
        .from('chair_procedures')
        .delete()
        .eq('chair_id', chairId)

      if (deleteError) {
        console.error('Error deleting existing procedures:', deleteError)
        return NextResponse.json({ error: 'Failed to delete existing procedures' }, { status: 500 })
      }

      // Insert new chair procedures
      if (procedureData && procedureData.length > 0) {
        const chairProcedurePayload = procedureData.map((proc: any) => ({
          chair_prod_id: `${chairId}_${proc.procedure_id}`,
          chair_id: chairId,
          prod_id: proc.procedure_id
        }))

        const { error: insertError } = await supabase
          .from('chair_procedures')
          .insert(chairProcedurePayload)

        if (insertError) {
          console.error('Error inserting new procedures:', insertError)
          return NextResponse.json({ error: 'Failed to insert new procedures' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Chair updated successfully' 
    })

  } catch (error) {
    console.error('Error in PUT /api/dental-chairs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}