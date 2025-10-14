// // app/api/form/clinician/actions.ts
// "use server"

// import { cookies } from 'next/headers'
// import { createServerClient } from '@supabase/ssr'

// import { NextRequest, NextResponse } from 'next/server'
// import { supabase } from '@/lib/supabase'

// // Types for request validation
// interface AttendanceRequest {
//   patientName: string
//   selectedProcedures: string[]
//   shift: string
//   clinicianUserId: string
// }

// // Create authenticated supabase client
// async function createAuthenticatedSupabaseClient() {
//   const cookieStore = await cookies()

//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll: () => cookieStore.getAll(),
//         setAll: (cookiesToSet) => {
//           cookiesToSet.forEach(({ name, value, options }) =>
//             cookieStore.set(name, value, options)
//           )
//         },
//         remove: (name, options) => cookieStore.set(name, "", { ...options, maxAge: 0 }),
//       },
//     }
//   )
// }
// // Server action for form submission
// export async function submitAttendanceAction(formData: {
//   patientName: string
//   selectedProcedures: string[]
//   shift: string 
//   clinicianUserId: string
// }) {
//   const supabase = await createAuthenticatedSupabaseClient()

//   try {
//     // Validate form data
//     const errors: string[] = []

//     if (!formData.patientName || !formData.patientName.trim()) {
//       errors.push('Patient name is required')
//     }

//     if (!formData.shift || !['1st', '2nd'].includes(formData.shift)) {
//       errors.push('Valid shift selection is required (1st or 2nd)')
//     }

//     if (!formData.clinicianUserId) {
//       errors.push('Clinician user ID is required')
//     }

//     if (!Array.isArray(formData.selectedProcedures) || formData.selectedProcedures.length === 0) {
//       errors.push('At least one procedure must be selected')
//     }

//     if (formData.selectedProcedures && formData.selectedProcedures.length > 2) {
//       errors.push('Maximum 2 procedures can be selected')
//     }

//     if (errors.length > 0) {
//       return { success: false, error: 'Validation failed', details: errors }
//     }

//     // Debug: Log the clinicianUserId being searched for
//     console.log('Searching for clinician with auth_user_id:', formData.clinicianUserId)

//     // Verify clinician exists - now using authenticated client
//     const { data: clinician, error: clinicianError } = await supabase
//       .from('users')
//       .select('id, first_name, last_name, auth_user_id')
//       .eq('auth_user_id', formData.clinicianUserId)
//       .single()

//     // Debug: Log the query result
//     console.log('Clinician query result:', { data: clinician, error: clinicianError })

//     if (clinicianError || !clinician) {
//       // Additional debugging: Let's see what users exist
//       const { data: allUsers, error: debugError } = await supabase
//         .from('users')
//         .select('id, first_name, last_name, auth_user_id')
//         .limit(5)
      
//       console.log('Sample users in database:', allUsers)
//       console.log('Debug query error:', debugError)
      
//       console.error('Clinician verification failed:', clinicianError)
//       return {
//         success: false,
//         error: 'Invalid clinician credentials',
//         debug: {
//           searchedUserId: formData.clinicianUserId,
//           sampleUsers: allUsers?.map(u => ({ id: u.id, auth_user_id: u.auth_user_id })) || []
//         }
//       }
//     }

//     // Verify procedures exist
//     const { data: procedureData, error: procedureError } = await supabase
//       .from('procedure')
//       .select('procedure_id')
//       .in('procedure_id', formData.selectedProcedures)

//     if (procedureError) {
//       console.error('Procedure verification failed:', procedureError)
//       return { success: false, error: 'Failed to verify procedures' }
//     }

//     if (!procedureData || procedureData.length !== formData.selectedProcedures.length) {
//       return { success: false, error: 'One or more selected procedures are invalid' }
//     }

//     // Generate new request ID
//     const newRequestId = await generateRequestId(supabase)

//     // Insert main request record
//     const { data: requestData, error: requestError } = await supabase
//       .from('request')
//       .insert({
//         request_id: newRequestId,
//         patient_name: formData.patientName.trim(),
//         clinician_id: formData.clinicianUserId,
//         shift: formData.shift,
//         status: 'pending',
//         createdAt: new Date().toISOString()
//       })
//       .select()

//     if (requestError) {
//       console.error('Failed to insert request:', requestError)
//       return { success: false, error: 'Failed to create attendance request' }
//     }

//     // Create procedure association records
//     const procedureRows = formData.selectedProcedures.map((procedureId) => ({
//       rp_id: `${newRequestId}-${procedureId}`,
//       request_id: newRequestId,
//       procedure_id: procedureId,
//     }))

//     const { data: procedureInsertData, error: procedureInsertError } = await supabase
//       .from('Requested_Procedures')
//       .insert(procedureRows)

//     if (procedureInsertError) {
//       console.error('Failed to insert requested procedures:', procedureInsertError)
      
//       // Rollback: Delete the request record
//       await supabase
//         .from('request')
//         .delete()
//         .eq('request_id', newRequestId)
      
//       return { success: false, error: 'Failed to associate procedures with request' }
//     }

//     // Log successful submission
//     console.log(`Attendance request ${newRequestId} submitted successfully by ${clinician.first_name} ${clinician.last_name}`)

//     // Return success response
//     return {
//       success: true,
//       requestId: newRequestId,
//       message: 'Attendance request submitted successfully',
//       data: {
//         requestId: newRequestId,
//         patientName: formData.patientName,
//         procedures: formData.selectedProcedures,
//         shift: formData.shift,
//         submittedBy: `${clinician.first_name} ${clinician.last_name}`,
//         submittedAt: new Date().toISOString()
//       }
//     }

//   } catch (error) {
//     console.error('Unexpected error in attendance submission:', error)
    
//     return {
//       success: false,
//       error: 'Internal server error',
//       message: 'An unexpected error occurred while processing your request'
//     }
//   }
// }

// // Generate next request ID
// async function generateRequestId(supabase: any): Promise<string> {
//   const year = new Date().getFullYear()
  
//   try {
//     const { data: latest, error } = await supabase
//       .from('request')
//       .select('request_id')
//       .order('createdAt', { ascending: false })
//       .limit(1)

//     if (error) {
//       console.error('Error fetching latest request ID:', error)
//       // Fallback to first ID of the year
//       return `RQST${year}-0001`
//     }

//     if (!latest || latest.length === 0) {
//       return `RQST${year}-0001`
//     }

//     const lastId = latest[0].request_id
//     const lastNumber = parseInt(lastId.split('-')[1], 10)
//     const nextNumber = lastNumber + 1
    
//     return `RQST${year}-${nextNumber.toString().padStart(4, '0')}`
//   } catch (error) {
//     console.error('Error generating request ID:', error)
//     // Fallback with timestamp to ensure uniqueness
//     const timestamp = Date.now().toString().slice(-4)
//     return `RQST${year}-${timestamp}`
//   }
// }

// export async function getUserData() {
//   const supabase = await createAuthenticatedSupabaseClient()

//   try {
//     // Get authenticated user
//     const { data: userData, error: userError } = await supabase.auth.getUser()
//     if (userError || !userData.user) {
//       console.error("Authentication error:", userError)
//       return { error: "User not authenticated", user: null, clinician: null }
//     }

//     console.log("Authenticated user ID:", userData.user.id)
//     console.log("Authenticated user email:", userData.user.email)

//     // Fetch user details
//     const { data: clinician, error: clinicianError } = await supabase
//       .from("users")
//       .select("first_name, last_name, role")
//       .eq("auth_user_id", userData.user.id)
//       .single()

//     if (clinicianError) {
//       console.error("Clinician fetch error:", clinicianError)
//       return { error: "Failed to fetch clinician data", user: userData.user, clinician: null }
//     }

//     console.log("Found clinician:", clinician)

//     return { 
//       error: null, 
//       user: userData.user, 
//       clinician 
//     }
//   } catch (error) {
//     console.error("Error in getUserData:", error)
//     return { error: "Failed to load user data", user: null, clinician: null }
//   }
// }

// export async function getProcedures() {
//   const supabase = await createAuthenticatedSupabaseClient()

//   try {
//     const { data: procedureData, error: procedureError } = await supabase
//       .from("procedure")
//       .select("procedure_id, name")

//     if (procedureError) {
//       console.error("Procedure fetch error:", procedureError)
//       return { error: "Failed to load procedures", procedures: [] }
//     }

//     return { error: null, procedures: procedureData || [] }
//   } catch (error) {
//     console.error("Error fetching procedures:", error)
//     return { error: "Failed to load procedures", procedures: [] }
//   }
// }


// app/api/form/clinician/actions.ts
"use server"

import { cookies } from 'next/headers'
import { createAuthenticatedSupabaseClient } from '@/lib/supabase-route'

// Create authenticated supabase client


export async function getUserData() {
  const supabase = await createAuthenticatedSupabaseClient()

  try {
    // Get authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      console.error("Authentication error:", userError)
      return { error: "User not authenticated", user: null, clinician: null }
    }

    console.log("Authenticated user ID:", userData.user.id)
    console.log("Authenticated user email:", userData.user.email)

    // Fetch user details
    const { data: clinician, error: clinicianError } = await supabase
      .from("users")
      .select("first_name, last_name, role")
      .eq("auth_user_id", userData.user.id)
      .single()

    if (clinicianError) {
      console.error("Clinician fetch error:", clinicianError)
      return { error: "Failed to fetch clinician data", user: userData.user, clinician: null }
    }

    console.log("Found clinician:", clinician)

    return { 
      error: null, 
      user: userData.user, 
      clinician 
    }
  } catch (error) {
    console.error("Error in getUserData:", error)
    return { error: "Failed to load user data", user: null, clinician: null }
  }
}

export async function getProcedures() {
  const supabase = await createAuthenticatedSupabaseClient()

  try {
    const { data: procedureData, error: procedureError } = await supabase
      .from("procedure")
      .select("procedure_id, name")

    if (procedureError) {
      console.error("Procedure fetch error:", procedureError)
      return { error: "Failed to load procedures", procedures: [] }
    }

    return { error: null, procedures: procedureData || [] }
  } catch (error) {
    console.error("Error fetching procedures:", error)
    return { error: "Failed to load procedures", procedures: [] }
  }
}

// Server action for form submission
export async function submitAttendanceAction(formData: {
  patientName: string
  selectedProcedures: string[]
  shift: string
  clinicianUserId: string
}) {
  const supabase = await createAuthenticatedSupabaseClient()

  try {
    // Validate form data
    const errors: string[] = []

    if (!formData.patientName || !formData.patientName.trim()) {
      errors.push('Patient name is required')
    }

    if (!formData.shift || !['1st', '2nd'].includes(formData.shift)) {
      errors.push('Valid shift selection is required (1st or 2nd)')
    }

    if (!formData.clinicianUserId) {
      errors.push('Clinician user ID is required')
    }

    if (!Array.isArray(formData.selectedProcedures) || formData.selectedProcedures.length === 0) {
      errors.push('At least one procedure must be selected')
    }

    if (formData.selectedProcedures && formData.selectedProcedures.length > 2) {
      errors.push('Maximum 2 procedures can be selected')
    }

    if (errors.length > 0) {
      return { success: false, error: 'Validation failed', details: errors }
    }

    // Debug: Log the clinicianUserId being searched for
    console.log('Searching for clinician with auth_user_id:', formData.clinicianUserId)

    // Verify clinician exists - now using authenticated client
    const { data: clinician, error: clinicianError } = await supabase
      .from('users')
      .select('first_name, last_name, auth_user_id')
      .eq('auth_user_id', formData.clinicianUserId)
      .single()

    // Debug: Log the query result
    console.log('Clinician query result:', { data: clinician, error: clinicianError })

    if (clinicianError || !clinician) {
      // Additional debugging: Let's see what users exist
      const { data: allUsers, error: debugError } = await supabase
        .from('users')
        .select('first_name, last_name, auth_user_id')
        .limit(5)
      
      console.log('Sample users in database:', allUsers)
      console.log('Debug query error:', debugError)
      
      console.error('Clinician verification failed:', clinicianError)
      return {
        success: false,
        error: 'Invalid clinician credentials',
        debug: {
          searchedUserId: formData.clinicianUserId,
          sampleUsers: allUsers?.map(u => ({ id: u.id, auth_user_id: u.auth_user_id })) || []
        }
      }
    }

    // Verify procedures exist
    const { data: procedureData, error: procedureError } = await supabase
      .from('procedure')
      .select('procedure_id')
      .in('procedure_id', formData.selectedProcedures)

    if (procedureError) {
      console.error('Procedure verification failed:', procedureError)
      return { success: false, error: 'Failed to verify procedures' }
    }

    if (!procedureData || procedureData.length !== formData.selectedProcedures.length) {
      return { success: false, error: 'One or more selected procedures are invalid' }
    }

    // Generate new request ID
    // const newRequestId = await generateRequestId(supabase)
    // console.log(newRequestId)

    // Insert main request record
    const { data: requestData, error: requestError } = await supabase
      .from('request')
      .insert({
        patient_name: formData.patientName.trim(),
        clinician_id: formData.clinicianUserId,
        shift: formData.shift,
        status: 'Pending',
        created_at: new Date().toISOString()
      })
      .select("request_id")
      .single()

    if (requestError) {
      console.error('Failed to insert request:', requestError)
      return { success: false, error: 'Failed to create attendance request' }
    }

    const newRequestId = requestData.request_id;
    console.log(newRequestId)

    // Create procedure association records
    const procedureRows = formData.selectedProcedures.map((procedureId) => ({
      rp_id: `${newRequestId}-${procedureId}`,
      request_id: newRequestId,
      procedure_id: procedureId,
    }))

    const { data: procedureInsertData, error: procedureInsertError } = await supabase
      .from('requested_procedures')
      .insert(procedureRows)

    if (procedureInsertError) {
      console.error('Failed to insert requested procedures:', procedureInsertError)
      
      // Rollback: Delete the request record
      await supabase
        .from('request')
        .delete()
        .eq('request_id', newRequestId)
      
      return { success: false, error: 'Failed to associate procedures with request' }
    }

    // Log successful submission
    console.log(`Attendance request ${newRequestId} submitted successfully by ${clinician.first_name} ${clinician.last_name}`)

    // Return success response
    return {
      success: true,
      requestId: newRequestId,
      message: 'Attendance request submitted successfully',
      data: {
        requestId: newRequestId,
        patientName: formData.patientName,
        procedures: formData.selectedProcedures,
        shift: formData.shift,
        submittedBy: `${clinician.first_name} ${clinician.last_name}`,
        submittedAt: new Date().toISOString()
      }
    }

  } catch (error) {
    console.error('Unexpected error in attendance submission:', error)
    
    return {
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request'
    }
  }
}

// // Generate next request ID
// async function generateRequestId(supabase: any): Promise<string> {
//   const year = new Date().getFullYear()
  
//   try {
//     const { data: latest, error } = await supabase
//       .from('request')
//       .select('request_id')
//       .order('created_at', { ascending: false })
//       .limit(1)

//     if (error) {
//       console.error('Error fetching latest request ID:', error)
//       // Fallback to first ID of the year
//       return `RQST${year}-0001`
//     }

//     if (!latest || latest.length === 0) {
//       return `RQST${year}-0001`
//     }

//     const lastId = latest[0].request_id
//     const lastNumber = parseInt(lastId.split('-')[1], 10)
//     const nextNumber = lastNumber + 1
    
//     return `RQST${year}-${nextNumber.toString().padStart(4, '0')}`
//   } catch (error) {
//     console.error('Error generating request ID:', error)
//     // Fallback with timestamp to ensure uniqueness
//     const timestamp = Date.now().toString().slice(-4)
//     return `RQST${year}-${timestamp}`
//   }
// }