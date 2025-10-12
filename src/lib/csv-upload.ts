export async function uploadCliniciansCsv(
  file: File,
  userId: string,
  role: string,
  academicYearId: string,
): Promise<{ status: string; message: string }> {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", userId)
    formData.append("role", role)
    formData.append("academicYearId", academicYearId)

    console.log("[v0] Uploading CSV with params:", {
      fileName: file.name,
      userId,
      role,
      academicYearId,
    })

    const response = await fetch("/api/upload-csv", {
      method: "POST",
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        status: "error",
        message: result.message || "Failed to upload CSV file",
      }
    }

    return {
      status: "success",
      message: result.message || "CSV file uploaded successfully",
    }
  } catch (error) {
    console.error("[v0] CSV upload error:", error)
    return {
      status: "error",
      message: "An unexpected error occurred during upload",
    }
  }
}
