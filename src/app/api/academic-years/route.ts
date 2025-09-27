import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET() {
  try {
    console.log("[v0] Starting GET /api/academic-years")
    console.log("[v0] Using admin client for consistent access")

    console.log("[v0] Admin client config check:", {
      hasUrl: !!process.env.SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlValue: process.env.SUPABASE_URL?.substring(0, 30) + "...",
    })

    const { data: academicYears, error } = await supabaseAdmin
      .from("academic_year")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.log("[v0] Error fetching academic years:", error)
      console.log("[v0] Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data to match frontend interface
    const transformedData = academicYears.map((year) => ({
      id: year.id,
      academicYear: year.academic_year,
      semester: year.semester,
      status: year.status === "active" ? "Active" : "Inactive",
      createdAt: year.created_at,
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.log("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting POST /api/academic-years")

    const body = await request.json()
    const { startYear, endYear, semester, status } = body

    // Validate required fields
    if (!startYear || !endYear || !semester) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate ID and academic year string
    const academicYearString = `${startYear}-${endYear}`
    const id = `AY${startYear}-${semester === "1st" ? "001" : "002"}`

    const { data, error } = await supabaseAdmin
      .from("academic_year")
      .insert({
        id,
        academic_year: academicYearString,
        semester,
        status: status?.toLowerCase() || "active",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.log("[v0] Error creating academic year:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform response to match frontend interface
    const transformedData = {
      id: data.id,
      academicYear: data.academic_year,
      semester: data.semester,
      status: data.status === "active" ? "Active" : "Inactive",
      createdAt: data.created_at,
    }

    return NextResponse.json(transformedData, { status: 201 })
  } catch (error) {
    console.log("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] Starting PUT /api/academic-years")

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("academic_year")
      .update({ status: status.toLowerCase() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.log("[v0] Error updating academic year:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform response
    const transformedData = {
      id: data.id,
      academicYear: data.academic_year,
      semester: data.semester,
      status: data.status === "active" ? "Active" : "Inactive",
      createdAt: data.created_at,
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.log("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
