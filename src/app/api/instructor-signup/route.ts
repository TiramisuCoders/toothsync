//app/api/instructor-signup/route.ts

import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

// Generate instructor ID in format: year + 6 random numbers (e.g., 2025123456)
function generateInstructorId(): number {
  const randomSuffix = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0")
  return Number.parseInt(`2022${randomSuffix}`)
}

export async function POST(request: NextRequest) {
  try {
    console.log("[instructor-signup] API called")

    const body = await request.json()
    console.log("[instructor-signup] Request body received:", {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      sex: body.sex,
      hasPassword: !!body.password,
    })

    const { firstName, lastName, email, password, sex, contactNumber } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !sex) {
      console.log("[instructor-signup] Validation failed: missing fields")
      return NextResponse.json({ 
        success: false, 
        message: "All fields are required" 
      }, { status: 400 })
    }

    // Validate sex value
    if (sex !== "Male" && sex !== "Female" && sex !== "Other") {
      console.log("[instructor-signup] Validation failed: invalid sex value")
      return NextResponse.json({ 
        success: false, 
        message: "Sex must be either Male, Female, or Other" 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("[instructor-signup] Validation failed: invalid email format")
      return NextResponse.json({ 
        success: false, 
        message: "Please provide a valid email address" 
      }, { status: 400 })
    }

    console.log("[instructor-signup] Checking if email already exists")

    // Check if email already exists in users table
    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from("users")
      .select("email, auth_user_id")
      .eq("email", email)
      .maybeSingle()

    if (existingUser) {
      console.log("[instructor-signup] Email already exists")
      
      // Check if they're already an instructor
      const { data: existingInstructor } = await supabaseAdmin
        .from("instructors")
        .select("instructor_id")
        .eq("user_id", existingUser.auth_user_id)
        .single()
      
      if (existingInstructor) {
        return NextResponse.json({
          success: false,
          message: "An instructor account with this email already exists",
        }, { status: 400 })
      }
      
      return NextResponse.json({
        success: false,
        message: "An account with this email already exists",
      }, { status: 400 })
    }

    console.log("[instructor-signup] Creating user in Supabase auth")

    // Create user in Supabase auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: "R03"
      }
    })

    if (authError || !authData.user) {
      console.error("[instructor-signup] Auth user creation error:", authError)
      return NextResponse.json({
        success: false,
        message: authError?.message || "Failed to create authentication account",
      }, { status: 500 })
    }

    console.log("[instructor-signup] Auth user created with ID:", authData.user.id)

    // Generate custom instructor_id
    const instructorId = generateInstructorId()
    console.log("[instructor-signup] Generated instructor_id:", instructorId)

    const now = new Date().toISOString()

    try {
      console.log("[instructor-signup] Inserting into users table with role R03")

      // Insert into users table
      const { error: userError } = await supabaseAdmin.from("users").insert({
        auth_user_id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        sex: sex,
        role: "R03", // Clinical Instructor role
        contact_number: contactNumber || null,
        updated_at: now
      })

      if (userError) {
        console.error("[instructor-signup] Users table insertion error:", userError)
        // Rollback: delete auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({
          success: false,
          message: `Failed to create user record: ${userError.message}`,
        }, { status: 500 })
      }

      console.log("[instructor-signup] Users table insert successful")
      console.log("[instructor-signup] Inserting into instructors table with status 'For Approval'")

      // Insert into instructors table with custom instructor_id and status
      const { error: instructorError } = await supabaseAdmin.from("instructors").insert({
        user_id: authData.user.id,
        instructor_id: instructorId,
        status: "For Approval" // This should work if the enum includes this value
      })

      if (instructorError) {
        console.error("[instructor-signup] Instructors table insertion error:", instructorError)
        console.error("[instructor-signup] Error details:", {
          code: instructorError.code,
          message: instructorError.message,
          details: instructorError.details,
          hint: instructorError.hint
        })
        
        // Rollback: delete from users and auth
        await supabaseAdmin.from("users").delete().eq("auth_user_id", authData.user.id)
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

        return NextResponse.json({
          success: false,
          message: `Failed to create instructor record: ${instructorError.message}`,
        }, { status: 500 })
      }

      console.log("[instructor-signup] Instructor signup successful")

      return NextResponse.json({
        success: true,
        message: "Sign-up successful! Your account is now pending approval from the admin. You'll gain full access once your account is verified.",
      })
    } catch (error) {
      console.error("[instructor-signup] Transaction error:", error)
      // Rollback: delete auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      } catch (deleteError) {
        console.error("[instructor-signup] Rollback error:", deleteError)
      }
      throw error
    }
  } catch (error) {
    console.error("[instructor-signup] Instructor signup error:", error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred during signup",
    }, { status: 500 })
  }
}