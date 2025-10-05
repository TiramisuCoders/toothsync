import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "../../../lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const academicYear = searchParams.get("academicYear")
    const semester = searchParams.get("semester")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    console.log("[v0] Activity History API - Params:", { academicYear, semester, search, page, limit, offset })

    const supabase = supabaseAdmin

    let countQuery = supabase.from("fact_activity_history").select("*", { count: "exact", head: true })

    let query = supabase
      .from("fact_activity_history")
      .select("*")
      .order("activity_date", { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters to both queries
    if (academicYear && academicYear !== "all") {
      query = query.eq("academic_year", academicYear)
      countQuery = countQuery.eq("academic_year", academicYear)
    }

    if (semester && semester !== "all") {
      query = query.eq("semester", semester)
      countQuery = countQuery.eq("semester", semester)
    }

    if (search && search.trim()) {
      const searchFilter = `clinician_name.ilike.%${search}%,instructor.ilike.%${search}%,procedure_name.ilike.%${search}%`
      query = query.or(searchFilter)
      countQuery = countQuery.or(searchFilter)
    }

    const [{ data, error }, { count, error: countError }] = await Promise.all([query, countQuery])

    if (error || countError) {
      console.error("[v0] Activity History API Error:", error || countError)
      return NextResponse.json({ error: (error || countError)?.message }, { status: 500 })
    }

    console.log("[v0] Activity History API - Found records:", data?.length || 0, "Total:", count)

    const transformedData =
      data?.map((record, index) => ({
        id: `${record.act_id}-${offset + index}`, // Ensure unique keys
        firstName: record.clinician_name?.split(" ")[0] || "",
        lastName: record.clinician_name?.split(" ").slice(1).join(" ") || "",
        chair: record.chair || "",
        instructor: record.instructor || "",
        procedure: record.procedure_name || "",
        grade: record.grade || "",
        date: record.activity_date,
        academicYear: record.academic_year || "",
        semester: record.semester || "",
      })) || []

    return NextResponse.json({
      data: transformedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("[v0] Activity History API Exception:", error)
    return NextResponse.json({ error: "Failed to fetch activity history" }, { status: 500 })
  }
}
