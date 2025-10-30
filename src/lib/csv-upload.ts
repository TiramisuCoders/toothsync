export async function uploadCliniciansCsv(
  file: File,
  userId: string,
  role: string,
  academicYearId: string
): Promise<{ status: string; message: string; processedCount?: number; skippedCount?: number; errors?: string[] }> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId)
    formData.append('role', role)
    formData.append('academicYearId', academicYearId)

    const response = await fetch('/api/upload-csv', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        status: 'error',
        message: result.message || 'Failed to upload CSV file.',
      }
    }

    return {
      status: result.status,
      message: result.message,
      processedCount: result.processedCount,
      skippedCount: result.skippedCount,
      errors: result.errors,
    }
  } catch (error) {
    console.error('Error uploading CSV:', error)
    return {
      status: 'error',
      message: 'An unexpected error occurred while uploading the CSV file.',
    }
  }
}