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
    
    const { data: userRole, error: roleError  } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

      if (roleError || !userRole) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

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
      user_id: user.id,
      userRole: userRole.role
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

    // 2. Update procedures if provided
    if (procedures && Array.isArray(procedures)) {
  // 1. Get all department IDs that match the selected procedure names
  const { data: departments, error: deptErr } = await supabase
    .from('departments')
    .select('id, name')
    .in('name', procedures)

  if (deptErr) {
    console.error('Error fetching departments:', deptErr)
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
  }

  // 2. Get current chair_procedure records
  const { data: existingProcedures, error: existingErr } = await supabase
    .from('chair_procedures')
    .select('department_id')
    .eq('chair_id', chairId)

  if (existingErr) {
    console.error('Error fetching existing chair procedures:', existingErr)
    return NextResponse.json({ error: 'Failed to fetch existing chair procedures' }, { status: 500 })
  }

  // Convert to ID arrays for easier comparison
  const existingIds = existingProcedures.map((p: any) => p.department_id)
  const newIds = departments.map((d: any) => d.id)

  // 3. Determine which to delete and which to add
  const toDelete = existingIds.filter((id) => !newIds.includes(id))
  const toAdd = newIds.filter((id) => !existingIds.includes(id))

  // 4. Delete only those that were unchecked
  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('chair_procedures')
      .delete()
      .eq('chair_id', chairId)
      .in('department_id', toDelete)

    if (deleteError) {
      console.error('Error deleting chair procedures:', deleteError)
      return NextResponse.json({ error: 'Failed to delete chair procedures' }, { status: 500 })
    }
  }

  // 5. Insert only the newly added ones
  if (toAdd.length > 0) {
    const payload = toAdd.map((deptId) => ({
      chair_dept_id: `${chairId}_${deptId}`,
      chair_id: chairId,
      department_id: deptId,
    }))

    const { error: insertError } = await supabase
      .from('chair_procedures')
      .insert(payload)

    if (insertError) {
      console.error('Error inserting new chair procedures:', insertError)
      return NextResponse.json({ error: 'Failed to insert new chair procedures' }, { status: 500 })
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