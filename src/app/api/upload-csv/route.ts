import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import fs from "fs"
import path from "path"
import os from "os"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ status: "error", message: "No file uploaded." }, { status: 400 })
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

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseKey) {
      fs.unlinkSync(tempPath)
      return NextResponse.json(
        { status: "error", message: "Server configuration error: Supabase keys missing." },
        { status: 500 },
      )
    }

    const pythonExecutable = process.env.PYTHON_EXECUTABLE || "python3"

    const result = await new Promise<{ ok: boolean; stdout: string; stderr: string; exitCode: number }>((resolve) => {
      const python = spawn(pythonExecutable, [pythonScriptPath, tempPath, supabaseUrl, supabaseKey], {
        stdio: ["ignore", "pipe", "pipe"],
      })

      let stdout = ""
      let stderr = ""

      python.stdout.on("data", (data) => {
        stdout += data.toString()
      })

      python.stderr.on("data", (data) => {
        stderr += data.toString()
      })

      python.on("close", (code) => {
        resolve({ ok: code === 0, stdout, stderr, exitCode: code ?? -1 })
      })

      python.on("error", (err) => {
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
      // Prefer the "Finished processing CSV..." line if present
      const finished = [...lines].reverse().find((l) => /^Finished processing CSV\./.test(l))
      if (finished) return finished
      const total = lines.find((l) => /Total .* processed/i.test(l))
      if (total) return total
      return "Import has been successful."
    }

    if (result.ok) {
      const message = extractSummary(result.stdout)
      return NextResponse.json({ status: "success", message, logs: result.stdout }, { status: 200 })
    } else {
      const firstErrLine =
        (result.stderr || result.stdout).split(/\r?\n/).find((l) => l.trim().length > 0) || "ETL script failed."
      return NextResponse.json(
        { status: "error", message: firstErrLine, logs: result.stderr || result.stdout, exitCode: result.exitCode },
        { status: 500 },
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error"
    return NextResponse.json({ status: "error", message }, { status: 500 })
  }
}
