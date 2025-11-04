// lib/csv-upload.ts - IMPROVED VERSION

export async function uploadCliniciansCsv(
  file: File,
  userId: string,
  role: string,
  academicYearId: string
): Promise<{ 
  status: string
  message: string
  processedCount?: number
  skippedCount?: number
  errors?: string[] 
}> {
  try {
    console.log('Starting CSV upload...', {
      fileName: file.name,
      fileSize: file.size,
      academicYearId
    })

    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId)
    formData.append('role', role)
    formData.append('academicYearId', academicYearId)

    const response = await fetch('/api/upload-csv', {
      method: 'POST',
      body: formData,
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    // Check if response has content
    const contentType = response.headers.get('content-type')
    console.log('Content-Type:', contentType)

    if (!contentType || !contentType.includes('application/json')) {
      console.error('Response is not JSON!')
      const text = await response.text()
      console.error('Response text:', text)
      
      return {
        status: 'error',
        message: `Server returned non-JSON response. Status: ${response.status}. Response: ${text.substring(0, 200)}`,
      }
    }

    // Try to parse JSON
    let result
    try {
      result = await response.json()
      console.log('Parsed result:', result)
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError)
      const text = await response.text()
      console.error('Raw response:', text)
      
      return {
        status: 'error',
        message: 'Server returned invalid JSON response',
      }
    }

    // Check response status
    if (!response.ok) {
      console.error('Response not OK:', response.status, result)
      return {
        status: 'error',
        message: result.message || `Upload failed with status ${response.status}`,
        errors: result.errors
      }
    }

    // Success
    console.log('Upload successful:', result)
    return {
      status: result.status,
      message: result.message,
      processedCount: result.processedCount,
      skippedCount: result.skippedCount,
      errors: result.errors,
    }

  } catch (error: any) {
    console.error('Upload error:', error)
    console.error('Error stack:', error.stack)
    
    return {
      status: 'error',
      message: error.message || 'An unexpected error occurred while uploading the CSV file.',
    }
  }
}