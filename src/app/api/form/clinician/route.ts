// app/api/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Types for request validation
interface AttendanceRequest {
  patientName: string
  selectedProcedures: string[]
  shift: string
  clinicianUserId: string
}

// Validation function
function validateAttendanceData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.patientName || typeof data.patientName !== 'string' || !data.patientName.trim()) {
    errors.push('Patient name is required')
  }

  if (!data.shift || !['1st', '2nd'].includes(data.shift)) {
    errors.push('Valid shift selection is required (1st or 2nd)')
  }

  if (!data.clinicianUserId || typeof data.clinicianUserId !== 'string') {
    errors.push('Clinician user ID is required')
  }

  if (!Array.isArray(data.selectedProcedures) || data.selectedProcedures.length === 0) {
    errors.push('At least one procedure must be selected')
  }

  if (data.selectedProcedures && data.selectedProcedures.length > 2) {
    errors.push('Maximum 2 procedures can be selected')
  }

  // Validate procedure IDs are strings
  if (data.selectedProcedures && data.selectedProcedures.some((p: any) => typeof p !== 'string')) {
    errors.push('Invalid procedure selection')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Generate next request ID
async function generateRequestId(): Promise<string> {
  const year = new Date().getFullYear()
  
  try {
    const { data: latest, error } = await supabase
      .from('request')
      .select('request_id')
      .order('createdAt', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching latest request ID:', error)
      // Fallback to first ID of the year
      return `RQST${year}-0001`
    }

    if (!latest || latest.length === 0) {
      return `RQST${year}-0001`
    }

    const lastId = latest[0].request_id
    const lastNumber = parseInt(lastId.split('-')[1], 10)
    const nextNumber = lastNumber + 1
    
    return `RQST${year}-${nextNumber.toString().padStart(4, '0')}`
  } catch (error) {
    console.error('Error generating request ID:', error)
    // Fallback with timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-4)
    return `RQST${year}-${timestamp}`
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    console.log(body)
    
    // Validate request data
    const { isValid, errors } = validateAttendanceData(body)
    
    if (!isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: errors 
        },
        { status: 400 }
      )
    }

    const { patientName, selectedProcedures, shift, clinicianUserId }: AttendanceRequest = body

    
    // Verify clinician exists
    const { data: clinician, error: clinicianError } = await supabase
      .from('users')
      .select('auth_user_id, first_name, last_name')
      .eq('auth_user_id', clinicianUserId)
      .single()

    if (clinicianError || !clinician) {
      console.error('Clinician verification failed:', clinicianError)
      return NextResponse.json(
        { error: 'Invalid clinician credentials' },
        { status: 401 }
      )
    }

    // Verify procedures exist
    const { data: procedureData, error: procedureError } = await supabase
      .from('procedure')
      .select('procedure_id')
      .in('procedure_id', selectedProcedures)

    if (procedureError) {
      console.error('Procedure verification failed:', procedureError)
      return NextResponse.json(
        { error: 'Failed to verify procedures' },
        { status: 500 }
      )
    }

    if (!procedureData || procedureData.length !== selectedProcedures.length) {
      return NextResponse.json(
        { error: 'One or more selected procedures are invalid' },
        { status: 400 }
      )
    }

    // Generate new request ID
    const newRequestId = await generateRequestId()

    // Insert main request record
    const { data: requestData, error: requestError } = await supabase
      .from('request')
      .insert({
        request_id: newRequestId,
        patient_name: patientName.trim(),
        clinician_id: clinicianUserId,
        shift: shift,
        status: 'pending', // Add status field if it exists
        createdAt: new Date().toISOString()
      })
      .select()

    if (requestError) {
      console.error('Failed to insert request:', requestError)
      return NextResponse.json(
        { error: 'Failed to create attendance request' },
        { status: 500 }
      )
    }

    // Create procedure association records
    const procedureRows = selectedProcedures.map((procedureId) => ({
      rp_id: `${newRequestId}-${procedureId}`,
      request_id: newRequestId,
      procedure_id: procedureId,
    }))

    const { data: procedureInsertData, error: procedureInsertError } = await supabase
      .from('Requested_Procedures')
      .insert(procedureRows)

    if (procedureInsertError) {
      console.error('Failed to insert requested procedures:', procedureInsertError)
      
      // Rollback: Delete the request record
      await supabase
        .from('request')
        .delete()
        .eq('request_id', newRequestId)
      
      return NextResponse.json(
        { error: 'Failed to associate procedures with request' },
        { status: 500 }
      )
    }

    // Log successful submission
    console.log(`Attendance request ${newRequestId} submitted successfully by ${clinician.first_name} ${clinician.last_name}`)

    // Return success response
    return NextResponse.json({
      success: true,
      requestId: newRequestId,
      message: 'Attendance request submitted successfully',
      data: {
        requestId: newRequestId,
        patientName,
        procedures: selectedProcedures,
        shift,
        submittedBy: `${clinician.first_name} ${clinician.last_name}`,
        submittedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Unexpected error in attendance API:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request'
      },
      { status: 500 }
    )
  }
}

// Optional: Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}