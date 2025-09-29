// api/clerks/route.ts
import { createSupabaseServerClient } from "@/lib/supabase-server";

// Helper function to check if user is authorized (R04 = Chief Clinician)
async function checkAuthorization(supabase: any) {
  const { data, error: authError } = await supabase.auth.getUser()
  
  if (authError || !data?.user) {
    return { authorized: false, error: 'Authentication failed', status: 401 }
  }

  const { data: userRole, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('auth_user_id', data.user.id)
    .single()

  if (roleError || userRole?.role !== 'R04') {
    return { authorized: false, error: 'Insufficient permissions. Only Chief Clinicians can manage clerks.', status: 403 }
  }

  return { authorized: true, user: data.user }
}

// GET - Fetch all clerks
export async function GET() {
  const supabase = await createSupabaseServerClient()
  
  try {
    console.log('🔍 Starting clerk fetch process...')
    
    const authResult = await checkAuthorization(supabase)
    if (!authResult.authorized) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    console.log("✅ User authorized, fetching clerks...")

    // Get clerk records
    const { data: clerksData, error: clerksError } = await supabase
      .from("clerks")
      .select(`
        user_id,
        status,
        academic_year,
        createdat,
        updatedat,
        archived
      `);

    if (clerksError) {
      console.log('❌ Clerks query failed:', clerksError.message)
      return Response.json({ 
        error: 'Failed to fetch clerks', 
        details: clerksError.message 
      }, { status: 500 })
    }

    if (!clerksData || clerksData.length === 0) {
      return Response.json({ 
        success: true, 
        data: [],
        message: 'No clerks found'
      })
    }

    // Get user info for all clerk user_ids
    const userIds = clerksData.map(clerk => clerk.user_id)
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select(`
        auth_user_id,
        first_name,
        last_name,
        email,
        role
      `)
      .in('auth_user_id', userIds);

    if (usersError) {
      return Response.json({ 
        error: 'Failed to fetch user details', 
        details: usersError.message 
      }, { status: 500 })
    }

    // Combine and filter data
    const combinedData = clerksData.map(clerk => {
      const userInfo = usersData?.find(u => u.auth_user_id === clerk.user_id)
      return {
        ...clerk,
        users: userInfo
      }
    }).filter(clerk => {
      // Only include R02 (clerk role) users
      return clerk.users && clerk.users.role === 'R02'
    })

    // Transform data
    const transformedData = combinedData.map((clerk: any, index: number) => ({
      id: `CLK${String(index + 1).padStart(3, '0')}`,
      clerk_id: clerk.user_id,
      first_name: clerk.users?.first_name || '',
      last_name: clerk.users?.last_name || '',
      firstName: clerk.users?.first_name || '',
      lastName: clerk.users?.last_name || '',
      email: clerk.users?.email || '',
      year: clerk.academic_year || 'AY2024-1', // Use correct format
      section: ['A', 'B', 'C', 'D'][index % 4],
      status: clerk.status === 'Active' ? 'On Duty' : 'Not On Duty',
      archived: clerk.archived || false
    }))

    console.log('✅ Successfully fetched', transformedData.length, 'clerks')
    
    return Response.json({ 
      success: true, 
      data: transformedData,
      count: transformedData.length
    })
    
  } catch (error) {
    console.error('💥 Error in GET /api/clerks:', error)
    return Response.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Add new clerk (promote existing user to clerk role)
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  
  try {
    console.log('📝 Promoting user to clerk...')
    
    const authResult = await checkAuthorization(supabase)
    if (!authResult.authorized) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const { user_id, academic_year, section, status } = body

    // Validate required fields
    if (!user_id || !academic_year) {
      return Response.json({ 
        error: 'Missing required fields',
        details: 'user_id and academic_year are required'
      }, { status: 400 })
    }

    console.log(`Promoting user ${user_id} to clerk with academic year ${academic_year}`)

    // Check if user exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('auth_user_id, first_name, last_name, email, role')
      .eq('auth_user_id', user_id)
      .single()

    if (userCheckError || !existingUser) {
      console.log('User not found:', userCheckError?.message)
      return Response.json({ 
        error: 'User not found',
        details: 'Selected user does not exist in the system'
      }, { status: 404 })
    }

    console.log('Found user:', existingUser)

    // Check if user is already a clerk
    const { data: existingClerk } = await supabase
      .from('clerks')
      .select('user_id')
      .eq('user_id', user_id)
      .single()

    if (existingClerk) {
      return Response.json({ 
        error: 'User is already a clerk',
        details: `${existingUser.first_name} ${existingUser.last_name} is already in the clerks system`
      }, { status: 400 })
    }

    // Start a transaction-like approach
    console.log('Updating user role to R02...')
    
    // Update user role to R02 (clerk)
    const { error: roleUpdateError } = await supabase
      .from('users')
      .update({ role: 'R02' })
      .eq('auth_user_id', user_id)

    if (roleUpdateError) {
      console.log('Failed to update user role:', roleUpdateError.message)
      return Response.json({ 
        error: 'Failed to update user role',
        details: roleUpdateError.message
      }, { status: 500 })
    }

    console.log('Adding user to clerks table...')

    // Add to clerks table
    const { data: newClerk, error: insertError } = await supabase
      .from('clerks')
      .insert({
        user_id: user_id,
        status: status === 'On Duty' ? 'Active' : 'Inactive',
        academic_year: academic_year,
        archived: false
      })
      .select()
      .single()

    if (insertError) {
      console.log('Failed to add to clerks table:', insertError.message)
      
      // Rollback the role change
      await supabase
        .from('users')
        .update({ role: existingUser.role }) // Restore original role
        .eq('auth_user_id', user_id)
      
      return Response.json({ 
        error: 'Failed to add clerk',
        details: insertError.message
      }, { status: 500 })
    }

    console.log('✅ Successfully promoted user to clerk:', newClerk)

    return Response.json({ 
      success: true, 
      message: `Successfully promoted ${existingUser.first_name} ${existingUser.last_name} to clerk`,
      data: {
        ...newClerk,
        user_info: existingUser
      }
    })

  } catch (error) {
    console.error('💥 Error in POST /api/clerks:', error)
    return Response.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT - Update clerk
export async function PUT(request: Request) {
  const supabase = await createSupabaseServerClient()
  
  try {
    console.log('✏️ Updating clerk...')
    
    const authResult = await checkAuthorization(supabase)
    if (!authResult.authorized) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const { clerk_id, firstName, lastName, email, year, section, status, archived } = body

    if (!clerk_id) {
      return Response.json({ 
        error: 'Missing clerk_id',
        details: 'clerk_id is required for updates'
      }, { status: 400 })
    }

    console.log('Updating clerk with ID:', clerk_id)
    console.log('Update data:', { firstName, lastName, email, year, section, status, archived })

    // Check if clerk exists
    const { data: existingClerk, error: clerkCheckError } = await supabase
      .from('clerks')
      .select('user_id')
      .eq('user_id', clerk_id)
      .single()

    if (clerkCheckError || !existingClerk) {
      console.log('Clerk not found:', clerkCheckError?.message)
      return Response.json({ 
        error: 'Clerk not found',
        details: 'No clerk found with the provided ID'
      }, { status: 404 })
    }

    // For now, only update clerk-specific info to avoid permission issues
    // User info (name, email) updates require proper RLS policies
    // Section is not stored in database, so we skip it
    console.log('Skipping user info update due to RLS restrictions')
    console.log('Note: Section is not stored in database - it is display-only')
    
    // Update clerk info only (exclude section since it's not in database)
    const clerkUpdates: any = {}
    if (status) clerkUpdates.status = status === 'On Duty' ? 'Active' : 'Inactive'
    if (year) clerkUpdates.academic_year = year
    if (typeof archived === 'boolean') clerkUpdates.archived = archived
    // Note: section is not stored in clerks table, it's just for display

    console.log('Updating clerk info only:', clerkUpdates)

    if (Object.keys(clerkUpdates).length === 0) {
      return Response.json({ 
        error: 'No valid updates provided',
        details: 'Only clerk status, academic year, and archived status can be updated'
      }, { status: 400 })
    }

    const { data: updatedClerk, error: clerkUpdateError } = await supabase
      .from('clerks')
      .update(clerkUpdates)
      .eq('user_id', clerk_id)
      .select()
      .single()

    if (clerkUpdateError) {
      console.log('Failed to update clerk info:', clerkUpdateError.message)
      return Response.json({ 
        error: 'Failed to update clerk',
        details: clerkUpdateError.message
      }, { status: 500 })
    }

    console.log('✅ Successfully updated clerk:', updatedClerk)

    return Response.json({ 
      success: true, 
      message: 'Clerk status updated successfully (Note: Section is display-only and not stored)',
      data: updatedClerk,
      note: 'User personal info (name, email) and section updates require additional database changes'
    })

  } catch (error) {
    console.error('💥 Error in PUT /api/clerks:', error)
    return Response.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Archive/Unarchive clerk
export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient()
  
  try {
    console.log('🗃️ Archiving/Unarchiving clerk...')
    
    const authResult = await checkAuthorization(supabase)
    if (!authResult.authorized) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const { clerk_id, action } = body // action: 'archive' or 'unarchive'

    if (!clerk_id || !action) {
      return Response.json({ 
        error: 'Missing required fields',
        details: 'clerk_id and action (archive/unarchive) are required'
      }, { status: 400 })
    }

    // Check if clerk exists
    const { data: existingClerk, error: clerkCheckError } = await supabase
      .from('clerks')
      .select('user_id, archived')
      .eq('user_id', clerk_id)
      .single()

    if (clerkCheckError || !existingClerk) {
      return Response.json({ 
        error: 'Clerk not found',
        details: 'No clerk found with the provided ID'
      }, { status: 404 })
    }

    const newArchivedStatus = action === 'archive'

    // Update archived status
    const { data: updatedClerk, error: updateError } = await supabase
      .from('clerks')
      .update({ 
        archived: newArchivedStatus,
        status: newArchivedStatus ? 'Inactive' : 'Active' // Archived clerks are inactive
      })
      .eq('user_id', clerk_id)
      .select()
      .single()

    if (updateError) {
      return Response.json({ 
        error: `Failed to ${action} clerk`,
        details: updateError.message
      }, { status: 500 })
    }

    console.log(`✅ Successfully ${action}d clerk:`, updatedClerk)

    return Response.json({ 
      success: true, 
      message: `Clerk ${action}d successfully`,
      data: updatedClerk
    })

  } catch (error) {
    console.error('💥 Error in DELETE /api/clerks:', error)
    return Response.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}