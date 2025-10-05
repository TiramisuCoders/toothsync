import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import fs from "fs"
import path from "path"
import os from "os"
import { supabaseAdmin } from "@/lib/supabase/admin"

async function logActivity(userId: string | null, role: string, action: string, details?: string) {
  try {
    if (!supabaseAdmin) {
      console.error("[v0] Cannot log activity: Supabase admin client not available")
      return
    }

    console.log("[v0] Logging activity:", { userId, role, action, details })
    const { data, error } = await supabaseAdmin.from("activity_logs").insert([
      {
        user_id: userId ?? null, // ✅ null if not a real UUID
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
      console.warn("Warning: Supabase admin client not available. Check environment variables.")
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const tempFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    const tempPath = path.join(os.tmpdir(), tempFileName)
    fs.writeFileSync(tempPath, buffer)

    const pythonScriptPath = path.join(process.cwd(), "etl", "main.py")
    if (!fs.existsSync(pythonScriptPath)) {
      fs.unlinkSync(tempPath)
      return NextResponse.json({ status: "error", message: "Python ETL script not found on server." }, { status: 500 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || "https://your-project.supabase.co"
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key"

    if (supabaseUrl === "https://your-project.supabase.co" || supabaseKey === "your-service-role-key") {
      console.warn("Warning: Using default Supabase configuration. Set environment variables for production.")
    }

    const pythonExecutable = process.env.PYTHON_EXECUTABLE || "python3"
    console.log("[v0] Using Python executable:", pythonExecutable)

    // Instead, let the spawn process handle the executable resolution

    const result = await new Promise<{ ok: boolean; stdout: string; stderr: string; exitCode: number }>((resolve) => {
      const args = [pythonScriptPath, tempPath, supabaseUrl, supabaseKey, academicYearId]
      console.log("[v0] Spawning Python process with:", pythonExecutable, args)

      const python = spawn(pythonExecutable, args, {
        stdio: ["ignore", "pipe", "pipe"],
      })

      let stdout = ""
      let stderr = ""

      python.stdout.on("data", (data) => {
        const output = data.toString()
        stdout += output
        console.log("[v0] Python stdout:", output.trim())
      })

      python.stderr.on("data", (data) => {
        const output = data.toString()
        stderr += output
        console.log("[v0] Python stderr:", output.trim())
      })

      python.on("close", (code) => {
        console.log("[v0] Python process exited with code:", code)
        console.log("[v0] Final stdout:", stdout.trim())
        console.log("[v0] Final stderr:", stderr.trim())
        resolve({ ok: code === 0, stdout, stderr, exitCode: code ?? -1 })
      })

      python.on("error", (err) => {
        console.log("[v0] Python spawn error:", err.message)
        resolve({ ok: false, stdout, stderr: `Failed to spawn Python: ${err.message}`, exitCode: -1 })
      })
    })

    // Cleanup temp file (async; no need to await)
    fs.unlink(tempPath, () => {})

    const extractSummary = (log: string) => {
      const lines = log
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
      const finished = [...lines].reverse().find((l) => /^Finished processing CSV\./.test(l))
      if (finished) return finished
      const total = lines.find((l) => /Total .* processed/i.test(l))
      if (total) return total
      return "Import has been successful."
    }

    if (result.ok) {
      const message = extractSummary(result.stdout)

      // ✅ Log successful CSV upload
      console.log("[v0] CSV upload successful, logging activity...")
      await logActivity(
        safeUserId,
        safeRole,
        "UPLOAD_CSV",
        `File ${file.name} uploaded successfully with academic year ${academicYearId}.`,
      )

      return NextResponse.json({ status: "success", message, logs: result.stdout }, { status: 200 })
    } else {
      const firstErrLine =
        (result.stderr || result.stdout).split(/\r?\n/).find((l) => l.trim().length > 0) || "ETL script failed."

      // ❌ Log failed CSV upload
      console.log("[v0] CSV upload failed, logging activity...")
      await logActivity(
        safeUserId,
        safeRole,
        "UPLOAD_CSV_FAILED",
        `File ${file?.name} failed with academic year ${academicYearId}. Error: ${firstErrLine}`,
      )

      return NextResponse.json(
        { status: "error", message: firstErrLine, logs: result.stderr || result.stdout, exitCode: result.exitCode },
        { status: 500 },
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error"

    // ❌ Log exception
    console.log("[v0] CSV upload exception, logging activity...")
    await logActivity("Admin", "Admin", "UPLOAD_CSV_EXCEPTION", message) // ✅ null user_id

    return NextResponse.json({ status: "error", message }, { status: 500 })
  }
}
