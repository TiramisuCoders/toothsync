// api/dental-chairs/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { headers, cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { createServerClient } from "@supabase/ssr";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Json } from 'node_modules/@supabase/postgrest-js/dist/cjs/select-query-parser/types';

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
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    console.log('User role data:', userRole)
    console.log('Role value:', userRole?.role)

    // if (userRole?.role !== 'R01') {
    //   console.log('Role check failed:', userRole?.role, 'vs', 'R01')
    //   return Response.json({ error: 'Forbidden' }, { status: 403 })
    // }
    
    console.log("User is clerk")
    console.log('🔍 Fetching chair data with procedures...')

    // No need to parse since procedures is already JSON from the view

    const { data: chairs, error: chairError } = await supabase
      .from("dental_chair_status_v")
      .select(`
        chair_id,
        status,
        procedures
      `);

    console.log('- Chair query result:', chairs)
    console.log('- Chair query error:', chairError)

    if (chairError) {
      console.log('❌ Database query failed:', chairError.message)
      return Response.json({ error: 'Database error', details: chairError.message }, { status: 500 })
    }

    // Transform data to match your interface
    const transformedData = chairs?.map(chair => {
      // Since procedures is already JSON from the view, use it directly
      const procedures = Array.isArray(chair.procedures) ? chair.procedures : []
      
      return {
        id: chair.chair_id,
        procedures: procedures,
        status: chair.status,
        student: null // You might want to fetch this from another table if available
      }
    }) || []

    console.log('Transformed data:', transformedData)
    
    return Response.json({ 
      success: true, 
      data: transformedData,
      user_id: user.id 
    })
    
  } catch (error) {
    console.error('Error in GET /api/dental-chairs:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}