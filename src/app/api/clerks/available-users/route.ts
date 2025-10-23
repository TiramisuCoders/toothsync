// api/clerks/available-users/route.ts
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

// GET - Fetch available users for promotion to clerk
export async function GET() {
  const supabase = await createSupabaseServerClient()
  
  try {
    console.log('👥 Fetching available users for clerk promotion...')
    
    const authResult = await checkAuthorization(supabase)
    if (!authResult.authorized) {
      return Response.json({ error: authResult.error }, { status: authResult.status })
    }

    // Get users who are R01 (Clinicians) and not yet clerks
    // R01 clinicians can be promoted to R02 (clerk) when assigned
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
      .eq('role', 'R01') // Only get R01 (Clinician) role users
      .order('first_name', { ascending: true })

    console.log('Raw available users query result (R01 only):', availableUsers)

    if (usersError) {
      console.log('Failed to fetch users:', usersError.message)
      return Response.json({ 
        error: 'Failed to fetch users',
        details: usersError.message
      }, { status: 500 })
    }

    if (!availableUsers || availableUsers.length === 0) {
      console.log('No users found in database')
      return Response.json({ 
        success: true, 
        data: [],
        message: 'No users found in the system'
      })
    }

    // Get current clerks to filter them out
    const { data: currentClerks, error: clerksError } = await supabase
      .from('clerks')
      .select('user_id')

    console.log('Current clerks:', currentClerks)
    console.log('Clerks query error:', clerksError)

    const currentClerkIds = currentClerks?.map(clerk => clerk.user_id) || []

    // Filter out users who are already clerks
    const filteredUsers = availableUsers.filter(user => {
      const isAlreadyClerk = currentClerkIds.includes(user.auth_user_id)
      console.log(`User ${user.first_name} ${user.last_name} (${user.auth_user_id}): Already clerk? ${isAlreadyClerk}`)
      return !isAlreadyClerk
    })

    console.log(`✅ Found ${filteredUsers.length} users available for clerk promotion`)
    console.log('Filtered users:', filteredUsers.map(u => `${u.first_name} ${u.last_name} (${u.role})`))
    
    return Response.json({ 
      success: true, 
      data: filteredUsers,
      count: filteredUsers.length
    })
    
  } catch (error) {
    console.error('💥 Error fetching available users:', error)
    return Response.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}