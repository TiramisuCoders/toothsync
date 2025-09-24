// api/dental-chairs/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

// GET /api/dental-chairs - Fetch all chairs with procedures and status
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
    
    console.log('🔍 Fetching chair data with procedures and status...')

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
        procedure:prod_id(
          procedure_id,
          name
        )
      `)

    if (proceduresError) {
      console.log('❌ Procedures query failed:', proceduresError.message)
      return NextResponse.json({ error: 'Database error', details: proceduresError.message }, { status: 500 })
    }

    // Fetch chair availability for today's shift to check occupancy
    const today = new Date().toISOString().split('T')[0]
    const { data: chairAvailability, error: availabilityError } = await supabase
      .from('chair_availability')
      .select('chair_id, is_occupied')
      .eq('date', today)

    if (availabilityError) {
      console.log('❌ Availability query failed:', availabilityError.message)
      // Don't fail the request, just log the error
    }

    // Create maps for easier lookup
    const proceduresByChair = new Map()
    chairProcedures?.forEach((cp: any) => {
      if (!proceduresByChair.has(cp.chair_id)) {
        proceduresByChair.set(cp.chair_id, [])
      }
      if (cp.procedure) {
        proceduresByChair.get(cp.chair_id).push(cp.procedure.name)
      }
    })

    const occupancyByChair = new Map()
    chairAvailability?.forEach((ca: any) => {
      occupancyByChair.set(ca.chair_id, ca.is_occupied)
    })

    // Transform data to match your interface
    const transformedData = chairs?.map(chair => {
      const procedures = proceduresByChair.get(chair.chair_id) || []
      const isOccupied = occupancyByChair.get(chair.chair_id) || false
      
      // Determine status based on your logic
      let status: "Available" | "Occupied" | "Under Maintenance"
      if (!chair.is_active) {
        status = "Under Maintenance"
      } else if (isOccupied) {
        status = "Occupied"
      } else {
        status = "Available"
      }
      
      return {
        id: chair.chair_id.toString(),
        chair_name: chair.chair_name,
        procedures: procedures,
        status: status
        // student: status === "Occupied" ? "Student assigned" : null // You can fetch actual student info if needed
      }
    }) || []

    console.log('Transformed data:', transformedData)
    
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

    const { chairId, status, procedures } = await req.json()

    if (!chairId) {
      return NextResponse.json({ error: 'Chair ID is required' }, { status: 400 })
    }

    console.log('🔄 Updating chair:', chairId, 'Status:', status, 'Procedures:', procedures)

    // Start a transaction-like approach
    
    // 1. Update chair status (is_active)
    const isActive = status !== "Under Maintenance"
    const { error: chairUpdateError } = await supabase
      .from('chair')
      .update({ is_active: isActive })
      .eq('chair_id', parseInt(chairId))

    if (chairUpdateError) {
      console.error('Error updating chair status:', chairUpdateError)
      return NextResponse.json({ error: 'Failed to update chair status' }, { status: 500 })
    }

    // 2. Update chair availability if needed
    const today = new Date().toISOString().split('T')[0]
    const isOccupied = status === "Occupied"
    
    // Check if availability record exists for today
    const { data: existingAvailability } = await supabase
      .from('chair_availability')
      .select('chair_id')
      .eq('chair_id', chairId)
      .eq('date', today)
      .single()

    if (existingAvailability) {
      // Update existing record
      const { error: availabilityUpdateError } = await supabase
        .from('chair_availability')
        .update({ is_occupied: isOccupied })
        .eq('chair_id', chairId)
        .eq('date', today)

      if (availabilityUpdateError) {
        console.error('Error updating chair availability:', availabilityUpdateError)
      }
    } else {
      // Create new availability record
      const { error: availabilityInsertError } = await supabase
        .from('chair_availability')
        .insert({
          chair_id: chairId,
          date: today,
          shift: '1st', // Default shift - you might want to determine this dynamically
          is_occupied: isOccupied
        })

      if (availabilityInsertError) {
        console.error('Error inserting chair availability:', availabilityInsertError)
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