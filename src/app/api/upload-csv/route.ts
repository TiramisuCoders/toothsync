// app/api/upload-csv/route.ts - FIXED ROLE VALIDATION

import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { processClinicianCSV } from '@/lib/etl/csvProcessor'

export async function POST(request: NextRequest) {
  try {
    console.log('=== CSV Upload API Started ===')
    
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const role = formData.get('role') as string
    const academicYearId = formData.get('academicYearId') as string

    console.log('Received data:', {
      fileName: file?.name,
      fileSize: file?.size,
      userId,
      role,
      academicYearId
    })

    // Validate inputs
    if (!file) {
      console.error('No file provided')
      return NextResponse.json(
        { status: 'error', message: 'No file provided' },
        { status: 400 }
      )
    }

    if (!userId || !role || !academicYearId) {
      console.error('Missing required fields')
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // FIXED: Accept both role formats
    const isAuthorized = role === 'R04' || role === 'chief-of-clinicians'
    
    if (!isAuthorized) {
      console.error('Unauthorized role:', role)
      return NextResponse.json(
        { status: 'error', message: `Unauthorized. Only Chief of Clinicians can upload. Received role: ${role}` },
        { status: 403 }
      )
    }

    console.log('✅ Role authorized:', role)

    // Read file content
    const fileContent = await file.text()
    console.log('File content length:', fileContent.length)

    if (!fileContent || fileContent.trim().length === 0) {
      console.error('Empty file')
      return NextResponse.json(
        { status: 'error', message: 'File is empty' },
        { status: 400 }
      )
    }

    // Parse CSV
    console.log('Parsing CSV...')
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    })

    if (parseResult.errors && parseResult.errors.length > 0) {
      console.error('CSV parsing errors:', parseResult.errors)
      return NextResponse.json(
        {
          status: 'error',
          message: 'CSV parsing failed',
          errors: parseResult.errors.map(e => e.message)
        },
        { status: 400 }
      )
    }

    const rows = parseResult.data
    console.log(`Parsed ${rows.length} rows from CSV`)

    if (rows.length === 0) {
      console.error('No data rows in CSV')
      return NextResponse.json(
        { status: 'error', message: 'CSV file contains no data rows' },
        { status: 400 }
      )
    }

    // Validate CSV headers
    const requiredHeaders = [
      'Student ID',
      'First Name',
      'Last Name',
      'Email',
      'Gender',
      'Status',
      'Year Level',
      'Contact Number'
    ]

    const headers = Object.keys(rows[0])
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))

    if (missingHeaders.length > 0) {
      console.error('Missing required headers:', missingHeaders)
      return NextResponse.json(
        {
          status: 'error',
          message: `CSV is missing required columns: ${missingHeaders.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Process CSV data
    console.log('Starting CSV processing...')
    const result = await processClinicianCSV(rows, academicYearId)
    console.log('Processing complete:', result)

    // Return success response
    return NextResponse.json({
      status: result.success ? 'success' : 'partial',
      message: result.message,
      processedCount: result.processedCount,
      skippedCount: result.skippedCount,
      errors: result.errors
    })

  } catch (error: any) {
    console.error('=== CSV Upload API Error ===')
    console.error('Error:', error)
    console.error('Stack:', error.stack)

    // Return error response
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'An unexpected error occurred while processing the CSV file.',
        error: error.toString()
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}