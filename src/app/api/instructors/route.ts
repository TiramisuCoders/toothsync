import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

// Helper to parse gender string to match DB enum
const parseSex = (gender: string): "Male" | "Female" | "Other" => {
  const genderLower = gender.toLowerCase()
  if (genderLower === "male") return "Male"
  if (genderLower === "female") return "Female"
  return "Other"
}

// Helper to parse status for instructors
const parseStatus = (status: string): string => {
  return status
}

// Helper function to generate password using the pattern: first letter of first name + first letter of last name + last 4 digits of contact number
const generatePassword = (firstName: string, lastName: string, contactNumber: string): string => {
  const firstInitial = firstName.charAt(0).toUpperCase()
  const lastInitial = lastName.charAt(0).toUpperCase()
  const lastFourDigits = contactNumber.replace(/\D/g, "").slice(-4) // Remove non-digits and get last 4
  return `${firstInitial}${lastInitial}${lastFourDigits}`
}

// GET /api/instructors - Fetch all instructors with their specializations (OPTIMIZED)
export async function GET() {
  try {
    if (!supabaseAdmin) {
      console.error("Supabase admin client not available - missing environment variables")
      return NextResponse.json(
        {
          message: "Database Configuration Required",
          error:
            "Server-side environment variables are missing. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your v0 Project Settings (gear icon → Project Settings → Environment Variables).",
        },
        { status: 500 },
      )
    }

    const { data: testData, error: testError } = await supabaseAdmin
      .from("instructors")
      .select("instructor_id")
      .limit(1)

    if (testError) {
      console.error("Database connection test failed:", testError.message)
      return NextResponse.json(
        {
          message: "Database Connection Failed",
          error: `Cannot connect to database: ${testError.message}. Please check your Supabase configuration and Row Level Security policies.`,
        },
        { status: 500 },
      )
    }

    const { data: allProcedures, error: proceduresError } = await supabaseAdmin
      .from("procedure")
      .select("procedure_id, name")

    if (proceduresError) {
      console.error("Error fetching procedures:", proceduresError)
      return NextResponse.json(
        { message: "Error fetching procedures", error: proceduresError.message },
        { status: 500 },
      )
    }

    const procedureMap = new Map()
    allProcedures?.forEach((proc: any) => {
      procedureMap.set(proc.procedure_id, proc.name)
    })

    const { data: instructorsData, error: instructorsError } = await supabaseAdmin
      .from("instructors")
      .select("instructor_id, user_id, status")

    if (instructorsError) {
      console.error("Error fetching instructors data:", instructorsError)
      return NextResponse.json(
        { message: "Error fetching instructors data", error: instructorsError.message },
        { status: 500 },
      )
    }

    const userIds = instructorsData?.map((instructor: any) => instructor.user_id) || []
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from("users")
      .select("auth_user_id, first_name, last_name, email, sex, contact_number")
      .in("auth_user_id", userIds)

    if (usersError) {
      console.error("Error fetching users data:", usersError)
      return NextResponse.json({ message: "Error fetching users data", error: usersError.message }, { status: 500 })
    }

    const userMap = new Map()
    usersData?.forEach((user: any) => {
      userMap.set(user.auth_user_id, user)
    })

    const instructorIds = instructorsData?.map((instructor: any) => instructor.instructor_id) || []
    const { data: allSpecializations, error: specializationsError } = await supabaseAdmin
      .from("Instructors_Specialization")
      .select("instructor_id, specialized_procedure")
      .in("instructor_id", instructorIds)

    if (specializationsError) {
      console.error("Error fetching specializations:", specializationsError)
      return NextResponse.json(
        { message: "Error fetching specializations", error: specializationsError.message },
        { status: 500 },
      )
    }

    const specializationsByInstructor = new Map()
    allSpecializations?.forEach((spec: any) => {
      if (!specializationsByInstructor.has(spec.instructor_id)) {
        specializationsByInstructor.set(spec.instructor_id, [])
      }
      specializationsByInstructor.get(spec.instructor_id).push(spec.specialized_procedure)
    })

    const instructors =
      instructorsData?.map((instructor: any) => {
        const userData = userMap.get(instructor.user_id)
        const procedureIds = specializationsByInstructor.get(instructor.instructor_id) || []

        const specializations = procedureIds
          .map((id: string) => procedureMap.get(id))
          .filter((name: string) => name !== undefined)

        return {
          id: instructor.instructor_id.toString(),
          firstName: userData?.first_name || "",
          lastName: userData?.last_name || "",
          gender: userData?.sex || "Other",
          status: instructor.status || "Not Available",
          email: userData?.email || "",
          contactNumber: userData?.contact_number || "",
          expertise: specializations,
          archived: instructor.status === "Archived",
        }
      }) || []

    return NextResponse.json(instructors, { status: 200 })
  } catch (error: any) {
    console.error("Unexpected error in GET /api/instructors:", error)
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 })
  }
}

// POST /api/instructors - Add a new instructor
export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          message: "Database Configuration Required",
          error:
            "Server-side environment variables are missing. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your v0 Project Settings.",
        },
        { status: 500 },
      )
    }

    const { firstName, lastName, gender, email, contactNumber, status, expertise } = await req.json()

    if (!firstName || !lastName || !email || !gender || !status || !contactNumber) {
      return NextResponse.json(
        { message: "Missing required fields (including contact number for password generation)" },
        { status: 400 },
      )
    }

    let authUserId: string | null = null

    const generatedPassword = generatePassword(firstName, lastName, contactNumber)
    console.log(`[v0] Generated password for ${firstName} ${lastName}: ${generatedPassword}`)

    const { data: newAuthUserData, error: newAuthUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true,
    })

    if (newAuthUserError) {
      if (newAuthUserError.message.includes("User already registered")) {
        const { data: existingAuthUserData, error: existingAuthUserError } =
          await supabaseAdmin.auth.admin.getUserByEmail(email)
        if (existingAuthUserError) {
          console.error("Error fetching existing auth user:", existingAuthUserError)
          return NextResponse.json(
            { message: `Failed to get existing auth user: ${existingAuthUserError.message}` },
            { status: 500 },
          )
        }
        if (existingAuthUserData?.user) {
          authUserId = existingAuthUserData.user.id
        }
      } else {
        console.error("Error creating auth user:", newAuthUserError)
        return NextResponse.json(
          { message: `Failed to create auth user: ${newAuthUserError.message}` },
          { status: 500 },
        )
      }
    } else if (newAuthUserData?.user) {
      authUserId = newAuthUserData.user.id
    }

    if (!authUserId) {
      return NextResponse.json({ message: "Failed to obtain auth user ID." }, { status: 500 })
    }

    const userPayload = {
      auth_user_id: authUserId,
      first_name: firstName,
      last_name: lastName,
      email: email,
      sex: parseSex(gender),
      role: "R03",
      contact_number: contactNumber || null,
    }

    const { data: existingUser, error: fetchUserError } = await supabaseAdmin
      .from("users")
      .select("auth_user_id")
      .eq("auth_user_id", authUserId)
      .single()

    if (fetchUserError && fetchUserError.code !== "PGRST116") {
      console.error("Error checking existing user:", fetchUserError)
      return NextResponse.json({ message: `Database error: ${fetchUserError.message}` }, { status: 500 })
    }

    if (existingUser) {
      const { error: updateUserError } = await supabaseAdmin
        .from("users")
        .update(userPayload)
        .eq("auth_user_id", authUserId)
      if (updateUserError) {
        console.error("Error updating user:", updateUserError)
        return NextResponse.json({ message: `Failed to update user: ${updateUserError.message}` }, { status: 500 })
      }
    } else {
      const { error: insertUserError } = await supabaseAdmin.from("users").insert([userPayload])
      if (insertUserError) {
        console.error("Error inserting user:", insertUserError)
        return NextResponse.json({ message: `Failed to insert user: ${insertUserError.message}` }, { status: 500 })
      }
    }

    const randomSuffix = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0")
    const instructorId = Number.parseInt(`2022${randomSuffix}`)

    const instructorPayload = {
      user_id: authUserId,
      instructor_id: instructorId,
      status: status || "Available",
    }

    const { error: insertInstructorError } = await supabaseAdmin.from("instructors").insert([instructorPayload])

    if (insertInstructorError) {
      console.error("Error inserting instructor:", insertInstructorError)
      return NextResponse.json(
        { message: `Failed to insert instructor: ${insertInstructorError.message}` },
        { status: 500 },
      )
    }

    if (expertise && expertise.length > 0) {
      const { data: proceduresData } = await supabaseAdmin
        .from("procedure")
        .select("procedure_id, name")
        .in("name", expertise)

      if (proceduresData && proceduresData.length > 0) {
        const specializationPayload = proceduresData.map((procedure: any) => ({
          instructor_id: instructorId,
          specialized_procedure: procedure.procedure_id,
        }))

        const { error: insertSpecializationError } = await supabaseAdmin
          .from("Instructors_Specialization")
          .insert(specializationPayload)

        if (insertSpecializationError) {
          console.error("Error inserting specializations:", insertSpecializationError)
        }
      }
    }

    return NextResponse.json({ message: "Instructor added successfully!" }, { status: 200 })
  } catch (error: any) {
    console.error("Unexpected error in POST /api/instructors:", error)
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 })
  }
}

// PUT /api/instructors - Update an instructor
export async function PUT(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          message: "Database Configuration Required",
          error:
            "Server-side environment variables are missing. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your v0 Project Settings.",
        },
        { status: 500 },
      )
    }

    const { id, firstName, lastName, gender, email, contactNumber, status, expertise } = await req.json()

    if (!id) {
      return NextResponse.json({ message: "Instructor ID is required" }, { status: 400 })
    }

    const instructorPayload = {
      status: status || "Available",
    }

    const { error: updateInstructorError } = await supabaseAdmin
      .from("instructors")
      .update(instructorPayload)
      .eq("instructor_id", Number.parseInt(id))

    if (updateInstructorError) {
      console.error("Error updating instructor:", updateInstructorError)
      return NextResponse.json(
        { message: `Failed to update instructor: ${updateInstructorError.message}` },
        { status: 500 },
      )
    }

    const { data: instructorData } = await supabaseAdmin
      .from("instructors")
      .select("user_id")
      .eq("instructor_id", Number.parseInt(id))
      .single()

    if (instructorData) {
      const userPayload = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        sex: parseSex(gender),
        contact_number: contactNumber || null,
      }

      await supabaseAdmin.from("users").update(userPayload).eq("auth_user_id", instructorData.user_id)
    }

    if (expertise) {
      await supabaseAdmin.from("Instructors_Specialization").delete().eq("instructor_id", Number.parseInt(id))

      if (expertise.length > 0) {
        const { data: proceduresData } = await supabaseAdmin
          .from("procedure")
          .select("procedure_id, name")
          .in("name", expertise)

        if (proceduresData && proceduresData.length > 0) {
          const specializationPayload = proceduresData.map((procedure: any) => ({
            instructor_id: Number.parseInt(id),
            specialized_procedure: procedure.procedure_id,
          }))

          await supabaseAdmin.from("Instructors_Specialization").insert(specializationPayload)
        }
      }
    }

    return NextResponse.json({ message: "Instructor updated successfully!" }, { status: 200 })
  } catch (error: any) {
    console.error("Unexpected error in PUT /api/instructors:", error)
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 })
  }
}
