// app/api/form/clinician/action.ts
"use server"

import { createAuthenticatedSupabaseClient } from '@/lib/supabase-route'
import { logRequestCreated } from '@/app/utils/activityLogger' // ADD THIS IMPORT

export async function getUserData() {
  const supabase = await createAuthenticatedSupabaseClient()

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      console.error("Authentication error:", userError)
      return { error: "User not authenticated", user: null, clinician: null }
    }

    console.log("Authenticated user ID:", userData.user.id)
    console.log("Authenticated user email:", userData.user.email)

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
      .select("procedure_id, name, department")

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

export async function getDepartments() {
  const supabase = await createAuthenticatedSupabaseClient()

  try {
    const { data: departmentData, error: departmentError } = await supabase
      .from("departments")
      .select("id, name")

    if (departmentError) {
      console.error("Deparments fetch error:", departmentError)
      return { error: "Failed to load deparments", departmentData: [] }
    }

    return { error: null, departmentData: departmentData || [] }
  } catch (error) {
    console.error("Error fetching department:", error)
    return { error: "Failed to load departmenrs", departmentData: [] }
  }
}

export async function submitAttendanceAction(formData: {
  record_id?: string
  patientName: string
  selectedProcedures: string[]
  shift: string
  clinicianUserId: string
  patient_type: string
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

    if (!formData.patient_type || !['Comprehensive', 'Individual'].includes(formData.patient_type)) {
      errors.push('Valid patient type selection is required (Comprehensive or Individual)')
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

    console.log('Searching for clinician with auth_user_id:', formData.clinicianUserId)

    // Verify clinician exists and get email for logging
    const { data: clinician, error: clinicianError } = await supabase
      .from('users')
      .select('first_name, last_name, auth_user_id, email, role') // ADD email and role
      .eq('auth_user_id', formData.clinicianUserId)
      .single()

    console.log('Clinician query result:', { data: clinician, error: clinicianError })
    console.log(formData.record_id)

    if (clinicianError || !clinician) {
      console.error('Clinician verification failed:', clinicianError)
      return {
        success: false,
        error: 'Invalid clinician credentials',
        debug: {
          searchedUserId: formData.clinicianUserId
        }
      }
    }

    // Verify procedures exist and get procedure names for logging
    const { data: procedureData, error: procedureError } = await supabase
      .from('procedure')
      .select('procedure_id, name') // ADD name for logging
      .in('procedure_id', formData.selectedProcedures)

    if (procedureError) {
      console.error('Procedure verification failed:', procedureError)
      return { success: false, error: 'Failed to verify procedures' }
    }

    if (!procedureData || procedureData.length !== formData.selectedProcedures.length) {
      return { success: false, error: 'One or more selected procedures are invalid' }
    }

    // Check if this is adding to an existing record or creating a new one
    if (formData.record_id) {
      const { data: existingRecord, error: recordError } = await supabase
        .from('activity_overview')
        .select('record_id, clinician_id')
        .eq('record_id', formData.record_id)
        .eq('clinician_id', formData.clinicianUserId)

      if (recordError || !existingRecord) {
        console.error('Record verification failed:', recordError)
        return { success: false, error: 'Invalid or unauthorized record access' }
      }

      console.log('Adding to existing record:', formData.record_id)
    }

    // Insert main request record
    const requestPayload: any = {
      patient_name: formData.patientName.trim(),
      clinician_id: formData.clinicianUserId,
      shift: formData.shift,
      patient_type: formData.patient_type,
      status: 'Pending',
      created_at: new Date().toISOString()
    }

    if (formData.record_id) {
      requestPayload.record_id = formData.record_id
    }

    const { data: requestData, error: requestError } = await supabase
      .from('request')
      .insert(requestPayload)
      .select("request_id")
      .single()

    if (requestError) {
      console.error('Failed to insert request:', requestError)
      return { success: false, error: 'Failed to create attendance request' }
    }

    const newRequestId = requestData.request_id
    console.log('Created request with ID:', newRequestId)

    // Create procedure association records
    const procedureRows = formData.selectedProcedures.map((procedureId) => ({
      rp_id: `${newRequestId}-${procedureId}`,
      request_id: newRequestId,
      procedure_id: procedureId,
    }))

    const { error: procedureInsertError } = await supabase
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

    // ========================================
    // ✅ LOG ACTIVITY - Request Created
    // ========================================
    const procedureNames = procedureData.map(p => p.name).join(', ')
    const resources = `chair and instructor for ${procedureNames}`
    
    await logRequestCreated(
      formData.clinicianUserId,
      clinician.role, // Role ID (R01, R02, etc.)
      clinician.email,
      newRequestId,
      resources
    )
    // ========================================

    // Log successful submission
    const submissionType = formData.record_id ? 'continuation' : 'new'
    console.log(`Attendance request ${newRequestId} (${submissionType}) submitted successfully by ${clinician.first_name} ${clinician.last_name}`)

    // Return success response
    return {
      success: true,
      requestId: newRequestId,
      message: formData.record_id 
        ? 'Attendance request added to existing record successfully'
        : 'Attendance request submitted successfully',
      data: {
        requestId: newRequestId,
        recordId: formData.record_id || null,
        patientName: formData.patientName,
        procedures: formData.selectedProcedures,
        shift: formData.shift,
        patient_type: formData.patient_type,
        submittedBy: `${clinician.first_name} ${clinician.last_name}`,
        submittedAt: new Date().toISOString()
      }
    }

  } catch (error) {
    console.error('Unexpected error in attendance submission:', error)
    
    return {
      success: false,
      error: 'Internal server error',
      message: 'An unexpected serror occurred while processing your request'
    }
  }
}