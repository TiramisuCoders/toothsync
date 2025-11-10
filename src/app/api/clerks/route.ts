// api/clerks/route.ts
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { headers } from 'next/headers';
import {
  logClerkPromoted,
  logClerkStatusChanged,
  logClerkArchived,
  logClerkUnarchived,
} from "@/app/utils/activityLogger";

// Helper function to check if user is authorized (R04 = Chief Clinician)
async function checkAuthorization(supabase: any) {
  const { data, error: authError } = await supabase.auth.getUser()
  
  if (authError || !data?.user) {
    return { authorized: false, error: 'Authentication failed', status: 401 }
  }

  const { data: userRole, error: roleError } = await supabase
    .from('users')
    .select('role, email')
    .eq('auth_user_id', data.user.id)
    .single()

  if (roleError || userRole?.role !== 'R04') {
    return { authorized: false, error: 'Insufficient permissions. Only Chief Clinicians can manage clerks.', status: 403 }
  }

  return { authorized: true, user: data.user, userInfo: userRole }
}

// Create admin client for privileged operations
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Helper to get client IP
async function getClientIp() {
  const headersList = await headers();
  return headersList.get('x-forwarded-for')?.split(',')[0] || 
         headersList.get('x-real-ip') || 
         'unknown';
}

// GET - Fetch all clerks OR available users OR academic years
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    const authResult = await checkAuthorization(supabase)
    if (!authResult.authorized) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    // Fetch academic years
    if (type === 'academic-years') {
      console.log('📅 Fetching academic years...')
      
      const { data: academicYears, error: yearError } = await supabase
        .from('academic_year')
        .select('id, academic_year, semester, status')
        .eq('status', 'active')
        .order('id', { ascending: false })

      if (yearError) {
        return Response.json({ 
          error: 'Failed to fetch academic years',
          details: yearError.message
        }, { status: 500 })
      }

      console.log(`✅ Found ${academicYears?.length || 0} academic years`)
      
      return Response.json({ 
        success: true, 
        data: academicYears || [],
        count: academicYears?.length || 0
      })
    }

    // Fetch available users for promotion
    if (type === 'available-users') {
      console.log('👥 Fetching available users for clerk promotion...')
      
      const { data: availableUsers, error: usersError } = await supabase
        .from('users')
        .select(`
          auth_user_id,
          first_name,
          last_name,
          email,
          role,
          sex,
          contact_number
        `)
        .eq('role', 'R01')
        .order('first_name', { ascending: true })

      if (usersError) {
        return Response.json({ 
          error: 'Failed to fetch users',
          details: usersError.message
        }, { status: 500 })
      }

      const { data: currentClerks } = await supabase
        .from('clerks')
        .select('user_id')

      const currentClerkIds = currentClerks?.map(clerk => clerk.user_id) || []
      const filteredUsers = availableUsers?.filter(user => 
        !currentClerkIds.includes(user.auth_user_id)
      ) || []

      console.log(`✅ Found ${filteredUsers.length} users available for clerk promotion`)
      
      return Response.json({ 
        success: true, 
        data: filteredUsers,
        count: filteredUsers.length
      })
    }

    // Default: Fetch all clerks
    console.log('🔍 Starting clerk fetch process...')

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

    const academicYearIds = [...new Set(clerksData.map(c => c.academic_year).filter(Boolean))]
    const { data: academicYearsData } = await supabase
      .from('academic_year')
      .select('id, academic_year, semester')
      .in('id', academicYearIds)

    const combinedData = clerksData
      .map(clerk => {
        const userInfo = usersData?.find(u => u.auth_user_id === clerk.user_id)
        const yearInfo = academicYearsData?.find(y => y.id === clerk.academic_year)
        return {
          ...clerk,
          users: userInfo,
          academic_year_info: yearInfo
        }
      })
      .filter(clerk => clerk.users)

    const transformedData = combinedData.map((clerk: any, index: number) => ({
      id: `CLK${String(index + 1).padStart(3, '0')}`,
      clerk_id: clerk.user_id,
      first_name: clerk.users?.first_name || '',
      last_name: clerk.users?.last_name || '',
      firstName: clerk.users?.first_name || '',
      lastName: clerk.users?.last_name || '',
      email: clerk.users?.email || '',
      year: clerk.academic_year || '',
      yearDisplay: clerk.academic_year_info?.academic_year || clerk.academic_year || '',
      semester: clerk.academic_year_info?.semester || '',
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
  const adminClient = getAdminClient()
  
  try {
    console.log('📝 Promoting user to clerk...')
    
    const authResult = await checkAuthorization(supabase)
    if (!authResult.authorized) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const { user_id, academic_year, status } = body

    console.log('Request body:', { user_id, academic_year, status })

    if (!user_id || !academic_year) {
      return Response.json({ 
        error: 'Missing required fields',
        details: 'user_id and academic_year are required'
      }, { status: 400 })
    }

    // Validate academic year exists
    const { data: yearExists, error: yearCheckError } = await supabase
      .from('academic_year')
      .select('id, academic_year')
      .eq('id', academic_year)
      .single()

    if (yearCheckError || !yearExists) {
      console.log('Academic year validation failed:', yearCheckError?.message)
      return Response.json({ 
        error: 'Invalid academic year',
        details: 'Selected academic year does not exist'
      }, { status: 400 })
    }

    console.log('Academic year validated:', yearExists)

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

    console.log('User found:', existingUser)

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

    console.log('User is not yet a clerk, proceeding...')

    // STEP 1: Update user role to R02 (clerk) FIRST
    console.log('Step 1: Updating user role to R02...')
    const { error: roleUpdateError } = await adminClient
      .from('users')
      .update({ role: 'R02' })
      .eq('auth_user_id', user_id)

    if (roleUpdateError) {
      console.log('Failed to update user role:', roleUpdateError)
      return Response.json({ 
        error: 'Failed to update user role',
        details: roleUpdateError.message
      }, { status: 500 })
    }

    console.log('✅ User role updated successfully to R02')

    // STEP 2: Add to clerks table (now the trigger will have the correct role)
    console.log('Step 2: Adding clerk record...')
    const { data: newClerk, error: insertError } = await adminClient
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
      console.log('Failed to add to clerks table:', insertError)
      
      // Rollback the role change
      console.log('Rolling back role change to R01...')
      await adminClient
        .from('users')
        .update({ role: existingUser.role })
        .eq('auth_user_id', user_id)
      
      return Response.json({ 
        error: 'Failed to add clerk',
        details: insertError.message
      }, { status: 500 })
    }

    console.log('✅ Clerk record added successfully:', newClerk)

    // STEP 3: Log the activity via edge function
    console.log('Step 3: Logging promotion activity...')
    const clientIp = await getClientIp();
    await logClerkPromoted(
      authResult.user.id,
      'R04',
      authResult.userInfo.email,
      user_id,
      existingUser.email,
      yearExists.academic_year,
      clientIp
    );

    console.log('✅ Successfully promoted user to clerk')

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

// PATCH - Update clerk status
export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient()
  const adminClient = getAdminClient()
  
  try {
    console.log('🔄 Updating clerk status...')
    
    const authResult = await checkAuthorization(supabase)
    if (!authResult.authorized) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const { clerk_id, status } = body

    if (!clerk_id || !status) {
      return Response.json({ 
        error: 'Missing required fields',
        details: 'clerk_id and status are required'
      }, { status: 400 })
    }

    // Check if clerk exists and get current status
    const { data: existingClerk, error: clerkCheckError } = await supabase
      .from('clerks')
      .select('user_id, status')
      .eq('user_id', clerk_id)
      .single()

    if (clerkCheckError || !existingClerk) {
      return Response.json({ 
        error: 'Clerk not found',
        details: 'No clerk found with the provided ID'
      }, { status: 404 })
    }

    // Get user info for logging
    const { data: userInfo } = await supabase
      .from('users')
      .select('first_name, last_name, email')
      .eq('auth_user_id', clerk_id)
      .single()

    const oldStatus = existingClerk.status === 'Active' ? 'On Duty' : 'Not On Duty';
    const newStatus = status;

    // Update clerk status using admin client
    const dbStatus = status === 'On Duty' ? 'Active' : 'Inactive'
    const { data: updatedClerk, error: updateError } = await adminClient
      .from('clerks')
      .update({ 
        status: dbStatus,
        updatedat: new Date().toISOString()
      })
      .eq('user_id', clerk_id)
      .select()
      .single()

    if (updateError) {
      return Response.json({ 
        error: 'Failed to update clerk status',
        details: updateError.message
      }, { status: 500 })
    }

    // Log the activity
    const clientIp = await getClientIp();
    await logClerkStatusChanged(
      authResult.user.id,
      'R04',
      authResult.userInfo.email,
      clerk_id,
      userInfo?.email || 'unknown',
      oldStatus,
      newStatus,
      clientIp
    );

    console.log('✅ Successfully updated clerk status:', updatedClerk)

    return Response.json({ 
      success: true, 
      message: 'Clerk status updated successfully',
      data: updatedClerk
    })

  } catch (error) {
    console.error('💥 Error in PATCH /api/clerks:', error)
    return Response.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Archive/Unarchive clerk
export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient()
  const adminClient = getAdminClient()
  
  try {
    console.log('🗃️ Archiving/Unarchiving clerk...')
    
    const authResult = await checkAuthorization(supabase)
    if (!authResult.authorized) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const { clerk_id, action } = body

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

    // Get user info for logging
    const { data: userInfo } = await supabase
      .from('users')
      .select('first_name, last_name, email, role')
      .eq('auth_user_id', clerk_id)
      .single()

    const newArchivedStatus = action === 'archive'
    const newRole = newArchivedStatus ? 'R01' : 'R02'

    // STEP 1: Update user role first
    console.log(`Step 1: Updating user role to ${newRole}...`)
    const { error: roleUpdateError } = await adminClient
      .from('users')
      .update({ role: newRole })
      .eq('auth_user_id', clerk_id)

    if (roleUpdateError) {
      return Response.json({ 
        error: 'Failed to update user role',
        details: roleUpdateError.message
      }, { status: 500 })
    }

    console.log(`✅ User role updated to ${newRole}`)

    // STEP 2: Update archived status in clerks table
    console.log('Step 2: Updating clerk archived status...')
    const { data: updatedClerk, error: updateError } = await adminClient
      .from('clerks')
      .update({ 
        archived: newArchivedStatus,
        status: newArchivedStatus ? 'Inactive' : 'Active',
        updatedat: new Date().toISOString()
      })
      .eq('user_id', clerk_id)
      .select()
      .single()

    if (updateError) {
      // Rollback role update if clerk update fails
      console.log('Clerk update failed, rolling back role change...')
      await adminClient
        .from('users')
        .update({ role: userInfo?.role })
        .eq('auth_user_id', clerk_id)
      
      return Response.json({ 
        error: `Failed to ${action} clerk`,
        details: updateError.message
      }, { status: 500 })
    }

    console.log(`✅ Clerk ${action}d successfully`)

    // STEP 3: Log the activity
    const clientIp = await getClientIp();
    if (action === 'archive') {
      await logClerkArchived(
        authResult.user.id,
        'R04',
        authResult.userInfo.email,
        clerk_id,
        userInfo?.email || 'unknown',
        clientIp
      );
    } else {
      await logClerkUnarchived(
        authResult.user.id,
        'R04',
        authResult.userInfo.email,
        clerk_id,
        userInfo?.email || 'unknown',
        clientIp
      );
    }

    console.log(`✅ Successfully ${action}d clerk and updated role to ${newRole}`)

    return Response.json({ 
      success: true, 
      message: `Clerk ${action}d successfully. Role changed to ${newRole}`,
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