export const runtime = "nodejs";

import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { processClinicianCSV } from "@/lib/etl/csvProcessor"

async function logActivity(userId: string | null, role: string, action: string, details?: string) {
  try {
    if (!supabaseAdmin) {
      console.error("[v0] Cannot log activity: Supabase admin client not available")
      return
    }

    console.log("[v0] Logging activity:", { userId, role, action, details })
    const { data, error } = await supabaseAdmin.from("activity_logs").insert([
      {
        user_id: userId ?? null,
        role,
        action,
        details,
      },
    ])

    if (error) {
      console.error("[v0] Failed to log activity - Supabase error:", error)
    } else {
      console.log("[v0] Activity logged successfully:", data)
    }
  } catch (error) {
    console.error("[v0] Failed to log activity - Exception:", error)
  }
}

function parseCSV(text: string): any[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim())
  if (lines.length === 0) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
  const rows: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const values: string[] = []
    let currentValue = ''
    let insideQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      const nextChar = line[j + 1]

      if (char === '"' || char === "'") {
        if (insideQuotes && nextChar === char) {
          currentValue += char
          j++ // Skip next quote
        } else {
          insideQuotes = !insideQuotes
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim())
        currentValue = ''
      } else {
        currentValue += char
      }
    }
    values.push(currentValue.trim())

    if (values.length === headers.length) {
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })
      rows.push(row)
    }
  }

  return rows
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const userId = formData.get("userId") as string | null
    const role = formData.get("role") as string | null
    const academicYearId = formData.get("academicYearId") as string | null

    console.log("[v0] CSV upload parameters:", { fileName: file?.name, userId, role, academicYearId })

    const safeUserId = userId && userId !== "Admin" ? userId : null
    const safeRole = role || "Admin"

    if (!file) {
      return NextResponse.json({ status: "error", message: "No file uploaded." }, { status: 400 })
    }

    if (!academicYearId) {
      return NextResponse.json({ status: "error", message: "Academic year ID is required." }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { status: "error", message: "Supabase admin client not available. Check environment variables." },
        { status: 500 }
      )
    }

    // Read file content
    const fileContent = await file.text()
    
    // Parse CSV
    const rows = parseCSV(fileContent)
    
    if (rows.length === 0) {
      return NextResponse.json(
        { status: "error", message: "CSV file is empty or improperly formatted." },
        { status: 400 }
      )
    }

    console.log(`[v0] Parsed ${rows.length} rows from CSV`)

    // Process CSV rows
    const result = await processClinicianCSV(rows, academicYearId)

    if (result.success) {
      console.log("[v0] CSV upload successful, logging activity...")
      await logActivity(
        safeUserId,
        safeRole,
        "UPLOAD_CSV",
        `File ${file.name} uploaded successfully with academic year ${academicYearId}. Processed: ${result.processedCount}, Skipped: ${result.skippedCount}`
      )

      return NextResponse.json(
        {
          status: "success",
          message: result.message,
          processedCount: result.processedCount,
          skippedCount: result.skippedCount,
        },
        { status: 200 }
      )
    } else {
      console.log("[v0] CSV upload completed with errors, logging activity...")
      await logActivity(
        safeUserId,
        safeRole,
        "UPLOAD_CSV_PARTIAL",
        `File ${file.name} processed with errors. Processed: ${result.processedCount}, Skipped: ${result.skippedCount}`
      )

      return NextResponse.json(
        {
          status: "partial_success",
          message: result.message,
          processedCount: result.processedCount,
          skippedCount: result.skippedCount,
          errors: result.errors,
        },
        { status: 200 }
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error"

    console.log("[v0] CSV upload exception, logging activity...")
    await logActivity(null, "Admin", "UPLOAD_CSV_EXCEPTION", message)

    return NextResponse.json({ status: "error", message }, { status: 500 })
  }
}