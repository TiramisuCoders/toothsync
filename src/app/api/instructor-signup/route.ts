import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

// Generate instructor ID in format: year + 6 random numbers (e.g., 2025123456)
function generateInstructorId(): string {
  const year = new Date().getFullYear()
  const randomNumbers = Math.floor(100000 + Math.random() * 900000) // 6-digit random number
  return `${year}${randomNumbers}`
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Instructor signup API called")

    const body = await request.json()
    console.log("[v0] Request body received:", {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      sex: body.sex,
      hasPassword: !!body.password,
    })

    const { firstName, lastName, email, password, sex } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !sex) {
      console.log("[v0] Validation failed: missing fields")
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 })
    }

    // Validate sex value
    if (sex !== "Male" && sex !== "Female") {
      console.log("[v0] Validation failed: invalid sex value")
      return NextResponse.json({ success: false, message: "Sex must be either Male or Female" }, { status: 400 })
    }

    console.log("[v0] Checking if email already exists")

    // Check if email already exists in users table
    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("email", email)
      .maybeSingle()

    if (existingUser) {
      console.log("[v0] Email already exists")
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Creating user in Supabase auth")

    // Create user in Supabase auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError || !authData.user) {
      console.error("[v0] Auth user creation error:", authError)
      return NextResponse.json(
        {
          success: false,
          message: authError?.message || "Failed to create authentication account",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Auth user created with ID:", authData.user.id)

    // Generate custom instructor_id
    const instructorId = generateInstructorId()
    console.log("[v0] Generated instructor_id:", instructorId)

    try {
      console.log("[v0] Inserting into users table with role R03")

      // Insert into users table
      const { error: userError } = await supabaseAdmin.from("users").insert({
        auth_user_id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        sex: sex,
        role: "R03", // Clinical Instructor role
      })

      if (userError) {
        console.error("[v0] Users table insertion error:", userError)
        // Rollback: delete auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json(
          {
            success: false,
            message: `Failed to create user record: ${userError.message}`,
          },
          { status: 500 },
        )
      }

      console.log("[v0] Inserting into instructors table with status 'For Approval'")

      // Insert into instructors table with custom instructor_id and status
      const { error: instructorError } = await supabaseAdmin.from("instructors").insert({
        user_id: authData.user.id,
        instructor_id: instructorId,
        status: "For Approval" as any, // Override default "Available" status
      })

      if (instructorError) {
        console.error("[v0] Instructors table insertion error:", instructorError)
        // Rollback: delete from users and auth
        await supabaseAdmin.from("users").delete().eq("auth_user_id", authData.user.id)
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

        if (instructorError.message?.includes("invalid input value for enum") || instructorError.code === "22P02") {
          return NextResponse.json(
            {
              success: false,
              message:
                "Database configuration error: The instructor status value is not configured properly. Please contact support.",
            },
            { status: 500 },
          )
        }

        return NextResponse.json(
          {
            success: false,
            message: `Failed to create instructor record: ${instructorError.message}`,
          },
          { status: 500 },
        )
      }

      console.log("[v0] Instructor signup successful")

      return NextResponse.json({
        success: true,
        message:
          "Sign-up successful! Your account is now pending approval from the admin. You'll gain full access once your account is verified.",
      })
    } catch (error) {
      console.error("[v0] Transaction error:", error)
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw error
    }
  } catch (error) {
    console.error("[v0] Instructor signup error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred during signup",
      },
      { status: 500 },
    )
  }
}
