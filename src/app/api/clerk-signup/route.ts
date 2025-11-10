//app/api/clerk-signup/route.ts

import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    console.log("[clerk-signup] API called")

    const body = await request.json()
    console.log("[clerk-signup] Request body received:", { studentId: body.studentId, hasPassword: !!body.password })

    const { studentId, password } = body

    // Validate required fields
    if (!studentId || !password) {
      console.log("[clerk-signup] Validation failed: missing fields")
      return NextResponse.json({ 
        success: false, 
        message: "Student ID and password are required" 
      }, { status: 400 })
    }

    console.log("[clerk-signup] Checking if student ID exists in clinicians table:", studentId)

    const { data: clinicianData, error: clinicianError } = await supabaseAdmin
      .from("clinicians")
      .select("user_id, student_id")
      .eq("student_id", studentId)
      .single()

    console.log("[clerk-signup] Clinician query result:", { found: !!clinicianData, error: clinicianError?.message })

    if (clinicianError || !clinicianData) {
      return NextResponse.json({
        success: false,
        message: "Can't sign up as clerk as you're not an enrolled clinician",
      }, { status: 403 })
    }

    console.log("[clerk-signup] Checking user role for user_id:", clinicianData.user_id)

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("role, auth_user_id, email")
      .eq("auth_user_id", clinicianData.user_id)
      .single()

    console.log("[clerk-signup] User query result:", { role: userData?.role, error: userError?.message })

    if (userError || !userData || userData.role !== "R01") {
      return NextResponse.json({
        success: false,
        message: "Can't sign up as clerk as you're not an enrolled clinician",
      }, { status: 403 })
    }

    console.log("[clerk-signup] Checking for existing clerk record")

    const { data: existingClerk, error: existingClerkError } = await supabaseAdmin
      .from("clerks")
      .select("user_id, status")
      .eq("user_id", clinicianData.user_id)
      .maybeSingle()

    console.log("[clerk-signup] Existing clerk check:", {
      exists: !!existingClerk,
      status: existingClerk?.status,
      error: existingClerkError?.message,
    })

    if (existingClerk) {
      const statusLower = existingClerk.status?.toLowerCase() || ""
      if (statusLower === "for approval") {
        return NextResponse.json({
          success: false,
          message: "Your clerk application is already pending for approval",
        }, { status: 400 })
      } else if (statusLower === "on duty" || statusLower === "not on duty" || statusLower === "active") {
        return NextResponse.json({
          success: false,
          message: "You already have a clerk account",
        }, { status: 400 })
      }
    }

    console.log("[clerk-signup] Fetching active academic year")

    const { data: activeAcademicYear, error: academicYearError } = await supabaseAdmin
      .from("academic_year")
      .select("id")
      .eq("status", "active")
      .maybeSingle()

    console.log("[clerk-signup] Active academic year query result:", {
      found: !!activeAcademicYear,
      id: activeAcademicYear?.id,
      error: academicYearError?.message,
    })

    if (academicYearError || !activeAcademicYear) {
      return NextResponse.json({
        success: false,
        message: "No active academic year found. Please contact the administrator.",
      }, { status: 500 })
    }

    // Update the user's password in auth
    console.log("[clerk-signup] Updating password for user")
    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.auth_user_id,
      { password: password }
    )

    if (passwordError) {
      console.error("[clerk-signup] Password update error:", passwordError)
      return NextResponse.json({
        success: false,
        message: `Failed to update password: ${passwordError.message}`,
      }, { status: 500 })
    }

    console.log("[clerk-signup] Attempting to insert clerk record with status 'For Approval'")

    const now = new Date().toISOString()
    // Use the correct column names: createdat and updatedat (not created_at and updated_at)
    const { error: clerkError } = await supabaseAdmin.from("clerks").insert({
      user_id: clinicianData.user_id,
      status: "For Approval",
      academic_year: activeAcademicYear.id,
      createdat: now,
      updatedat: now,
      archived: false
    })

    if (clerkError) {
      console.error("[clerk-signup] Clerk table insertion error:", clerkError)
      console.error("[clerk-signup] Error details:", {
        code: clerkError.code,
        message: clerkError.message,
        details: clerkError.details,
        hint: clerkError.hint
      })

      if (clerkError.message?.includes("invalid input value for enum") || clerkError.code === "22P02") {
        return NextResponse.json({
          success: false,
          message: "Database configuration error: The clerk status value is not configured properly. Please contact support.",
        }, { status: 500 })
      }

      return NextResponse.json({
        success: false,
        message: `Failed to create clerk application: ${clerkError.message}`,
      }, { status: 500 })
    }

    console.log("[clerk-signup] Clerk signup successful")

    return NextResponse.json({
      success: true,
      message: "Sign-up successful! Your account is now pending for approval from the admin. You'll gain full access once your account is verified.",
    })
  } catch (error) {
    console.error("[clerk-signup] Clerk signup error:", error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred during signup",
    }, { status: 500 })
  }
}