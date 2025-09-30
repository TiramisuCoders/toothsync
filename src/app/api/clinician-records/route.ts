import { NextResponse, type NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Starting GET /api/clinician-records")

    const { searchParams } = new URL(request.url)
    const academicYear = searchParams.get("academicYear")
    const yearLevel = searchParams.get("yearLevel")
    const section = searchParams.get("section")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    console.log("[v0] Clinician Records API - Params:", { academicYear, yearLevel, section, search, page, limit })

    let query = supabaseAdmin.from("clinician_records").select(
      `
        user_id,
        student_id,
        year_level,
        section,
        academic_year_id,
        created_at,
        clinicians!clinician_records_user_id_fkey(
          student_id,
          users!clinicians_user_id_fkey(
            first_name,
            last_name,
            sex
          )
        )
      `,
      { count: "exact" },
    )

    // Apply filters
    if (academicYear && academicYear !== "all") {
      query = query.eq("academic_year_id", academicYear)
    }

    if (yearLevel && yearLevel !== "all") {
      query = query.eq("year_level", yearLevel)
    }

    if (section && section !== "all") {
      query = query.eq("section", section)
    }

    // Searching across joined tables requires a different approach
    if (search && search.trim()) {
      query = query.ilike("student_id", `%${search}%`)
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    const { data: clinicianRecords, error, count } = await query

    if (error) {
      console.error("[v0] Clinician Records API Error:", error)
      return NextResponse.json({ error: "Failed to fetch clinician records", details: error.message }, { status: 500 })
    }

    console.log("[v0] Clinician Records API - Raw data:", clinicianRecords)

    const formattedData =
      clinicianRecords?.map((record: any) => ({
        id: `${record.user_id}-${record.academic_year_id}`,
        clinicianId: record.student_id,
        firstName: record.clinicians?.users?.first_name || "",
        lastName: record.clinicians?.users?.last_name || "",
        year: record.year_level,
        section: record.section,
        sex: record.clinicians?.users?.sex || "Other",
        academicYearId: record.academic_year_id,
        createdAt: record.created_at,
      })) || []

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    console.log("[v0] Clinician Records API - Found records:", formattedData.length, "Total:", total)

    return NextResponse.json({
      data: formattedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error("[v0] Clinician Records API Exception:", error)
    return NextResponse.json(
      { error: "Failed to fetch clinician records", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
