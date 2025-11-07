// api/dental-chairs/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

// GET /api/dental-chairs - Fetch all chairs with procedures and status for both shifts
export async function GET() {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { data, error: authError } = await supabase.auth.getUser()
    
    const user = data?.user
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: userRole, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (roleError || !userRole) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })

    const { data: chairs, error } = await supabase.rpc("get_chair_overview", {
      p_date: today
    })

    if (error) {
      console.error("❌ get_chair_overview failed:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: chairs,
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

    const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
    const timeNow = new Date().toISOString()

    // 1. Update overall chair status (is_active) - affects both shifts
    if (status && !shift) {
      const isActive = status !== "Under Maintenance"
      const { error: chairUpdateError } = await supabase
        .from("chair")
        .update({ is_active: isActive })
        .eq("chair_id", chairId)

      if (chairUpdateError) {
        console.error('Error updating chair status:', chairUpdateError)
        return NextResponse.json({ error: "Failed to update chair status" }, { status: 500 })
      }

      console.log('✅ Chair overall status updated successfully')
      return NextResponse.json({ 
        success: true,
        message: "Chair status updated successfully" 
      }, { status: 200 })
    }

    // 2. Update shift-specific status in chair_availability
    if (status && shift && date) {
      const isOccupied = status === "Occupied"
      const shiftValue = shift === "Shift 1" ? "1st" : "2nd"

      // Find the chair_availability record for this date and shift
      const { data: availability, error: fetchError } = await supabase
        .from("chair_availability")
        .select("*")
        .eq("chair_id", chairId)
        .eq("shift", shiftValue)
        .eq("date", date)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching chair_availability:", fetchError)
        return NextResponse.json({ error: "Failed to fetch chair availability" }, { status: 500 })
      }

      if (availability) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("chair_availability")
          .update({ 
            is_occupied: isOccupied,
            update_at: timeNow
          })
          .eq("id", availability.id)

        if (updateError) {
          console.error("Error updating chair_availability:", updateError)
          return NextResponse.json({ error: "Failed to update chair availability" }, { status: 500 })
        }

        console.log(`✅ Chair shift ${shiftValue} status updated successfully`)
      } else {
        // Create new record if it doesn't exist
        const { error: createError } = await supabase
          .from("chair_availability")
          .insert({
            chair_id: chairId,
            shift: shiftValue,
            date,
            is_occupied: isOccupied,
          })

        if (createError) {
          console.error("Error creating chair_availability:", createError)
          return NextResponse.json({ error: "Failed to create chair availability" }, { status: 500 })
        }

        console.log(`✅ Chair shift ${shiftValue} availability created successfully`)
      }

      return NextResponse.json({ 
        success: true,
        message: "Chair shift status updated successfully" 
      }, { status: 200 })
    }

    // 3. Update procedures if provided
    if (procedures && Array.isArray(procedures)) {
      // Get all department IDs that match the selected procedure names
      const { data: departments, error: deptErr } = await supabase
        .from('departments')
        .select('id, name')
        .in('name', procedures)

      if (deptErr) {
        console.error('Error fetching departments:', deptErr)
        return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
      }

      // Get current chair_procedure records
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

      // Determine which to delete and which to add
      const toDelete = existingIds.filter((id) => !newIds.includes(id))
      const toAdd = newIds.filter((id) => !existingIds.includes(id))

      // Delete unchecked procedures
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

      // Insert newly added procedures
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

      console.log('✅ Chair procedures updated successfully')
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