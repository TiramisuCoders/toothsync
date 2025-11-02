// ============================================
// COMPLETE FIXED VERSION
// Replace entire file: app/api/academic-years/route.ts
// ============================================

import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createAuthenticatedSupabaseClient } from '@/lib/supabase-route'
import { logAcademicYearCreated, logAcademicYearStatusChanged, logAcademicYearEdited } from '@/app/utils/activityLogger'

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Starting GET /api/academic-years")

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    console.log("[v0] Pagination params:", { page, limit, offset })

    const { count, error: countError } = await supabaseAdmin
      .from("academic_year")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.log("[v0] Error counting academic years:", countError)
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    const { data: academicYears, error } = await supabaseAdmin
      .from("academic_year")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.log("[v0] Error fetching academic years:", error)
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
    console.log("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createAuthenticatedSupabaseClient()
  
  try {
    console.log("[v0] Starting POST /api/academic-years")

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("[v0] Authentication failed:", authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, email')
      .eq('auth_user_id', user.id)
      .single()

    if (userError) {
      console.error("[v0] Failed to fetch user data:", userError)
    }

    const userRole = userData?.role || 'R02'
    const userEmail = userData?.email || user.email || 'unknown@example.com'
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     undefined

    // Parse and validate request
    const body = await request.json()
    const { startYear, endYear, semester, status, academicYear } = body

    let academicYearString: string
    
    if (academicYear) {
      academicYearString = academicYear
    } else if (startYear && endYear) {
      academicYearString = `${startYear}-${endYear}`
    } else {
      return NextResponse.json({ 
        error: "Missing required fields: academicYear or startYear/endYear" 
      }, { status: 400 })
    }

    if (!semester) {
      return NextResponse.json({ error: "Semester is required" }, { status: 400 })
    }

    // Generate ID
    const yearStart = academicYearString.split('-')[0]
    let semesterCode = '001'
    if (semester === '2nd') semesterCode = '002'
    else if (semester === 'summer') semesterCode = '003'
    
    const id = `AY${yearStart}-${semesterCode}`

    // Check for duplicate
    const { data: existing } = await supabaseAdmin
      .from("academic_year")
      .select("id")
      .eq("id", id)
      .single()

    if (existing) {
      return NextResponse.json({ 
        error: `Academic Year ${academicYearString} for ${semester} semester already exists` 
      }, { status: 409 })
    }

    // Create academic year
    const { data, error } = await supabaseAdmin
      .from("academic_year")
      .insert({
        id,
        academic_year: academicYearString,
        semester,
        status: status?.toLowerCase() || "inactive",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating academic year:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the creation
    await logAcademicYearCreated(
      user.id,
      userRole,
      userEmail,
      academicYearString,
      clientIp
    )

    console.log(`[v0] ✅ Academic year ${academicYearString} created and logged`)

    // Transform response
    const transformedData = {
      id: data.id,
      academicYear: data.academic_year,
      semester: data.semester,
      status: data.status === "active" ? "Active" : "Inactive",
      createdAt: data.created_at,
    }

    return NextResponse.json(transformedData, { status: 201 })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createAuthenticatedSupabaseClient()
  
  try {
    console.log("[v0] Starting PUT /api/academic-years")

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("[v0] Authentication failed:", authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, email')
      .eq('auth_user_id', user.id)
      .single()

    if (userError) {
      console.error("[v0] Failed to fetch user data:", userError)
    }

    const userRole = userData?.role || 'R02'
    const userEmail = userData?.email || user.email || 'unknown@example.com'
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     undefined

    // Parse request
    const body = await request.json()
    const { id, status, academic_year, semester } = body

    console.log("[v0] Update request:", { id, status, academic_year, semester })

    if (!id) {
      return NextResponse.json({ error: "Missing academic year ID" }, { status: 400 })
    }

    // Get current state BEFORE update
    const { data: currentState, error: fetchError } = await supabaseAdmin
      .from("academic_year")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !currentState) {
      console.error("[v0] Academic year not found:", id)
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 })
    }

    console.log("[v0] Current state:", {
      academic_year: currentState.academic_year,
      semester: currentState.semester,
      status: currentState.status
    })

    // Build update
    const updateData: any = {}
    
    if (status !== undefined) {
      updateData.status = status.toLowerCase()
    }
    if (academic_year) {
      updateData.academic_year = academic_year
    }
    if (semester) {
      updateData.semester = semester
    }

    console.log("[v0] Update data:", updateData)

    // Update database
    const { data, error } = await supabaseAdmin
      .from("academic_year")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating academic year:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ========================================
    // LOG ALL CHANGES
    // ========================================
    
    // Check if academic year or semester changed
    const yearChanged = academic_year && currentState.academic_year !== academic_year
    const semesterChanged = semester && currentState.semester !== semester
    const statusChanged = status !== undefined && currentState.status !== status.toLowerCase()

    // Log year/semester edits
    if (yearChanged || semesterChanged) {
      try {
        await logAcademicYearEdited(
          user.id,
          userRole,
          userEmail,
          currentState.academic_year,
          academic_year || currentState.academic_year,
          clientIp
        )
        console.log(`[v0] ✅ Edit logged: ${currentState.academic_year} → ${academic_year || currentState.academic_year}`)
      } catch (logError) {
        console.error("[v0] Failed to log edit:", logError)
      }
    }

    // Log status changes
    if (statusChanged) {
      const oldStatus = currentState.status === 'active' ? 'Active' : 'Inactive'
      const newStatus = status.toLowerCase() === 'active' ? 'Active' : 'Inactive'
      
      try {
        await logAcademicYearStatusChanged(
          user.id,
          userRole,
          userEmail,
          currentState.academic_year,
          oldStatus,
          newStatus,
          clientIp
        )
        console.log(`[v0] ✅ Status change logged: ${oldStatus} → ${newStatus}`)
      } catch (logError) {
        console.error("[v0] Failed to log status change:", logError)
      }
    }

    if (!yearChanged && !semesterChanged && !statusChanged) {
      console.log("[v0] No changes detected, nothing logged")
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
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}