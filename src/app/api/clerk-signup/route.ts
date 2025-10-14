import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Clerk signup API called")

    const body = await request.json()
    console.log("[v0] Request body received:", { studentId: body.studentId, hasPassword: !!body.password })

    const { studentId, password } = body

    // Validate required fields
    if (!studentId || !password) {
      console.log("[v0] Validation failed: missing fields")
      return NextResponse.json({ success: false, message: "Student ID and password are required" }, { status: 400 })
    }

    console.log("[v0] Checking if student ID exists in clinicians table:", studentId)

    const { data: clinicianData, error: clinicianError } = await supabaseAdmin
      .from("clinicians")
      .select("user_id, student_id")
      .eq("student_id", studentId)
      .single()

    console.log("[v0] Clinician query result:", { found: !!clinicianData, error: clinicianError?.message })

    if (clinicianError || !clinicianData) {
      return NextResponse.json(
        {
          success: false,
          message: "Can't sign up as clerk as you're not an enrolled clinician",
        },
        { status: 403 },
      )
    }

    console.log("[v0] Checking user role for user_id:", clinicianData.user_id)

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("role, auth_user_id")
      .eq("auth_user_id", clinicianData.user_id)
      .single()

    console.log("[v0] User query result:", { role: userData?.role, error: userError?.message })

    if (userError || !userData || userData.role !== "R01") {
      return NextResponse.json(
        {
          success: false,
          message: "Can't sign up as clerk as you're not an enrolled clinician",
        },
        { status: 403 },
      )
    }

    console.log("[v0] Checking for existing clerk record")

    const { data: existingClerk, error: existingClerkError } = await supabaseAdmin
      .from("clerks")
      .select("user_id, status")
      .eq("user_id", clinicianData.user_id)
      .maybeSingle()

    console.log("[v0] Existing clerk check:", {
      exists: !!existingClerk,
      status: existingClerk?.status,
      error: existingClerkError?.message,
    })

    if (existingClerk) {
      const statusLower = existingClerk.status?.toLowerCase() || ""
      if (statusLower.includes("For Approval") || statusLower === "For Approval") {
        return NextResponse.json(
          {
            success: false,
            message: "Your clerk application is already pending for approval",
          },
          { status: 400 },
        )
      } else if (statusLower === "active") {
        return NextResponse.json(
          {
            success: false,
            message: "You already have an active clerk account",
          },
          { status: 400 },
        )
      }
    }

    console.log("[v0] Fetching active academic year")

    const { data: activeAcademicYear, error: academicYearError } = await supabaseAdmin
      .from("academic_year")
      .select("id")
      .eq("status", "active")
      .maybeSingle()

    console.log("[v0] Active academic year query result:", {
      found: !!activeAcademicYear,
      id: activeAcademicYear?.id,
      error: academicYearError?.message,
    })

    if (academicYearError || !activeAcademicYear) {
      return NextResponse.json(
        {
          success: false,
          message: "No active academic year found. Please contact the administrator.",
        },
        { status: 500 },
      )
    }

    console.log(
      "[v0] Attempting to insert clerk record with status 'For Approval' and academic_year:",
      activeAcademicYear.id,
    )

    const { error: clerkError } = await supabaseAdmin.from("clerks").insert({
      user_id: clinicianData.user_id,
      status: "For Approval" as any,
      academic_year: activeAcademicYear.id,
    })

    if (clerkError) {
      console.error("[v0] Clerk table insertion error:", clerkError)

      if (clerkError.message?.includes("invalid input value for enum") || clerkError.code === "22P02") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Database configuration error: The clerk status value is not configured properly. Please contact support.",
          },
          { status: 500 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          message: `Failed to create clerk application: ${clerkError.message}`,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Clerk signup successful")

    return NextResponse.json({
      success: true,
      message:
        "Sign-up successful! Your account is now pending for approval from the admin. You'll gain full access once your account is verified.",
    })
  } catch (error) {
    console.error("[v0] Clerk signup error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred during signup",
      },
      { status: 500 },
    )
  }
}
