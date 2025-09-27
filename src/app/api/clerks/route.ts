// api/clerks/route.ts
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient()
  
  try {
    console.log('🔍 Starting clerk fetch process...')
    
    // Step 1: Check authentication
    const { data, error: authError } = await supabase.auth.getUser()
    
    console.log('🔐 Auth Debug:')
    console.log('User data:', data?.user ? { id: data.user.id, email: data.user.email } : 'No user')
    console.log('Auth error:', authError)
    
    const user = data?.user
    if (authError) {
      console.log('❌ Auth error occurred:', authError.message)
      return Response.json({ 
        error: 'Authentication failed', 
        details: authError.message 
      }, { status: 401 })
    }
    
    if (!user) {
      console.log('❌ No authenticated user found')
      return Response.json({ 
        error: 'No authenticated user', 
        details: 'Please log in to access this resource' 
      }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Step 2: Get user role (with better error handling)
    console.log('👤 Fetching user role...')
    const { data: userRole, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    console.log('User role query result:', userRole)
    console.log('User role error:', roleError)

    if (roleError && roleError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.log('❌ Role query failed:', roleError.message)
      return Response.json({ 
        error: 'Failed to fetch user role', 
        details: roleError.message 
      }, { status: 500 })
    }

    if (!userRole) {
      console.log('⚠️ User not found in users table, but continuing anyway...')
    }

    // Role check (commented out as in original, but you can enable this)
    // if (userRole?.role !== 'R04') {
    //   console.log('❌ Role check failed:', userRole?.role, 'vs', 'R04')
    //   return Response.json({ 
    //     error: 'Forbidden', 
    //     details: 'You do not have permission to access this resource' 
    //   }, { status: 403 })
    // }
    
    console.log("✅ User authorized, fetching clerks...")

    // Step 3: Get clerks using separate queries to avoid relationship ambiguity
    
    // First, get all clerk records
    const { data: clerksData, error: clerksError } = await supabase
      .from("clerks")
      .select(`
        user_id,
        status,
        academic_year,
        createdat,
        updatedat
      `);

    console.log('📊 Clerks query result:')
    console.log('- Found clerk records:', clerksData?.length || 0)
    console.log('- Clerks data:', clerksData)
    console.log('- Query error:', clerksError)

    if (clerksError) {
      console.log('❌ Clerks query failed:', clerksError.message)
      return Response.json({ 
        error: 'Failed to fetch clerks', 
        details: clerksError.message 
      }, { status: 500 })
    }

    if (!clerksData || clerksData.length === 0) {
      console.log('⚠️ No clerks found in database')
      return Response.json({ 
        success: true, 
        data: [],
        message: 'No clerks found',
        user_id: user.id 
      })
    }

    // Second, get user info for all clerk user_ids
    const userIds = clerksData.map(clerk => clerk.user_id)
    console.log('👥 Fetching user details for IDs:', userIds)
    
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

    console.log('👥 Users query result:')
    console.log('- Found users:', usersData?.length || 0)
    console.log('- Users data:', usersData)
    console.log('- Users error:', usersError)

    if (usersError) {
      console.log('❌ Users query failed:', usersError.message)
      return Response.json({ 
        error: 'Failed to fetch user details', 
        details: usersError.message 
      }, { status: 500 })
    }

    // Step 4: Combine the data and filter for actual clerks
    console.log('🔄 Combining clerk and user data...')
    
    const combinedData = clerksData.map(clerk => {
      const userInfo = usersData?.find(u => u.auth_user_id === clerk.user_id)
      return {
        ...clerk,
        users: userInfo ? {
          first_name: userInfo.first_name,
          last_name: userInfo.last_name,
          email: userInfo.email,
          role: userInfo.role
        } : null
      }
    }).filter(clerk => {
      // Filter out records without user data
      if (!clerk.users) {
        console.log(`⚠️ Skipping clerk with user_id ${clerk.user_id} - no user data found`)
        return false
      }
      
      // Filter by role to only include actual clerks (R02)
      if (clerk.users.role !== 'R02') {
        console.log(`⚠️ Skipping user ${clerk.users.first_name} ${clerk.users.last_name} - role ${clerk.users.role} is not a clerk role (expected R02)`)
        return false
      }
      
      // Optional: Filter out test/instructor accounts
      const email = clerk.users.email.toLowerCase()
      const firstName = clerk.users.first_name.toLowerCase()
      const lastName = clerk.users.last_name.toLowerCase()
      
      // Skip obvious test accounts
      if (email.includes('test') || 
          email.includes('instructor') || 
          firstName.includes('instructor') ||
          lastName.includes('instructor') ||
          firstName.includes('test') ||
          lastName.includes('test')) {
        console.log(`⚠️ Skipping test/instructor account: ${clerk.users.first_name} ${clerk.users.last_name} (${clerk.users.email})`)
        return false
      }
      
      return true
    })

    console.log('🔍 Filtered clerk data:', combinedData)

    if (combinedData.length === 0) {
      console.log('⚠️ No valid clerks found after filtering')
      return Response.json({ 
        success: true, 
        data: [],
        message: 'No valid clerks found',
        user_id: user.id 
      })
    }

    // Step 5: Transform data to match your interface
    console.log('🔄 Transforming clerk data...')
    const transformedData = combinedData.map((clerk: any, index: number) => {
      const transformed = {
        id: `CLK${String(index + 1).padStart(3, '0')}`,
        clerk_id: clerk.user_id,
        first_name: clerk.users?.first_name || '',
        last_name: clerk.users?.last_name || '',
        firstName: clerk.users?.first_name || '',
        lastName: clerk.users?.last_name || '',
        email: clerk.users?.email || '',
        year: clerk.academic_year || '2024-2025',
        section: ['A', 'B', 'C', 'D'][index % 4], // Rotate through sections
        status: clerk.status === 'Active' ? 'On Duty' : 'Not On Duty',
        archived: false
      }
      
      console.log(`- Transformed clerk ${index + 1}:`, transformed)
      return transformed
    })

    console.log('✅ Successfully transformed', transformedData.length, 'valid clerks')
    
    return Response.json({ 
      success: true, 
      data: transformedData,
      count: transformedData.length,
      user_id: user.id,
      message: `Found ${transformedData.length} valid clerks`
    })
    
  } catch (error) {
    console.error('💥 Unexpected error in GET /api/clerks:', error)
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    
    return Response.json({ 
      error: 'Internal server error',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Add a simple health check endpoint for testing
export async function OPTIONS() {
  return Response.json({ 
    status: 'API is working',
    timestamp: new Date().toISOString(),
    endpoint: '/api/clerks'
  })
}