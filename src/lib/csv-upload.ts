export const uploadCliniciansCsv = async (file: File): Promise<{ status: string; message: string }> => {
  try {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/upload-csv", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      return { status: "error", message: data.message || "Failed to upload CSV." }
    }

    return data
  } catch (error: any) {
    console.error("Error uploading CSV:", error)
    return { status: "error", message: error.message || "An unexpected error occurred." }
  }
}
