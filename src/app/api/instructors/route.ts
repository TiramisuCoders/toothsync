import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { v4 as uuidv4 } from "uuid"

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

// GET /api/instructors - Fetch all instructors with their specializations
export async function GET() {
  try {
    console.log("[v0] Starting GET /api/instructors")

    if (!supabaseAdmin) {
      console.error("[v0] Supabase admin client not available - missing environment variables")
      return NextResponse.json(
        {
          message: "Database Configuration Required",
          error:
            "Server-side environment variables are missing. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your v0 Project Settings (gear icon → Project Settings → Environment Variables).",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Testing database connection...")
    const { data: testData, error: testError } = await supabaseAdmin
      .from("instructors")
      .select("instructor_id")
      .limit(1)

    if (testError) {
      console.error("[v0] Database connection test failed:", testError.message)
      return NextResponse.json(
        {
          message: "Database Connection Failed",
          error: `Cannot connect to database: ${testError.message}. Please check your Supabase configuration and Row Level Security policies.`,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Database connection successful")

    const { data: instructorsData, error: instructorsError } = await supabaseAdmin
      .from("instructors")
      .select("instructor_id, user_id, status")

    if (instructorsError) {
      console.error("[v0] Error fetching instructors data:", instructorsError)
      return NextResponse.json(
        { message: "Error fetching instructors data", error: instructorsError.message },
        { status: 500 },
      )
    }

    console.log("[v0] Fetched instructors:", instructorsData?.length || 0)

    const instructors = await Promise.all(
      instructorsData.map(async (instructor: any) => {
        const { data: userData } = await supabaseAdmin
          .from("users")
          .select("first_name, last_name, email, sex, contact_number, address, birthday")
          .eq("auth_user_id", instructor.user_id)
          .single()

        const { data: specializationsData, error: specializationsError } = await supabaseAdmin
          .from("Instructors_Specialization")
          .select("specialized_procedure")
          .eq("instructor_id", instructor.instructor_id)

        let specializations: string[] = []
        if (specializationsError) {
          console.error(
            `[v0] Error fetching specializations for instructor ${instructor.instructor_id}:`,
            specializationsError,
          )
        } else if (specializationsData && specializationsData.length > 0) {
          const procedureIds = specializationsData.map((spec: any) => spec.specialized_procedure)
          console.log(`[v0] Found procedure IDs for instructor ${instructor.instructor_id}:`, procedureIds)

          const { data: allProcedures, error: allProceduresError } = await supabaseAdmin
            .from("procedure")
            .select("procedure_id, name")

          console.log(`[v0] All procedures in database:`, allProcedures)

          const { data: proceduresData, error: proceduresError } = await supabaseAdmin
            .from("procedure")
            .select("procedure_id, name")
            .in("procedure_id", procedureIds)

          console.log(`[v0] Query result for procedure IDs ${procedureIds}:`, proceduresData)

          if (proceduresError) {
            console.error(`[v0] Error fetching procedures for instructor ${instructor.instructor_id}:`, proceduresError)
          } else if (proceduresData && proceduresData.length > 0) {
            specializations = proceduresData.map((proc: any) => proc.name)
            console.log(`[v0] Mapped specializations for instructor ${instructor.instructor_id}:`, specializations)
          } else {
            console.log(`[v0] No procedure names found for instructor ${instructor.instructor_id}`)
            const procedureMapping: { [key: string]: string } = {
              P01: "Endodontics",
              P02: "Oral Prophylaxis",
              P03: "Restorative",
              P04: "Extraction",
              P05: "Simulation/Typodont",
              P06: "Prosthodontics",
            }

            specializations = procedureIds
              .map((id: string) => procedureMapping[id])
              .filter((name: string) => name !== undefined)

            console.log(`[v0] Using fallback mapping for instructor ${instructor.instructor_id}:`, specializations)
          }
        } else {
          console.log(`[v0] No specializations found for instructor ${instructor.instructor_id}`)
        }

        return {
          id: instructor.instructor_id.toString(),
          firstName: userData?.first_name || "",
          lastName: userData?.last_name || "",
          gender: userData?.sex || "Other",
          status: instructor.status || "Not Available",
          email: userData?.email || "",
          contactNumber: userData?.contact_number || "",
          address: userData?.address || "",
          expertise: specializations,
          archived: instructor.status === "Archived",
        }
      }),
    )

    console.log(
      "[v0] Final processed instructors with expertise:",
      instructors.map((i) => ({ id: i.id, name: `${i.firstName} ${i.lastName}`, expertise: i.expertise })),
    )
    return NextResponse.json(instructors, { status: 200 })
  } catch (error: any) {
    console.error("[v0] Unexpected error in GET /api/instructors:", error)
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

    const { firstName, lastName, gender, email, contactNumber, address, status, expertise } = await req.json()

    if (!firstName || !lastName || !email || !gender || !status) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    let authUserId: string | null = null

    const tempPassword = uuidv4()
    const { data: newAuthUserData, error: newAuthUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
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
      address: address || null,
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
      first_name: firstName,
      last_name: lastName,
      gender: parseSex(gender),
      email: email,
      status: status,
      updated_at: new Date().toISOString(),
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

    const { id, firstName, lastName, gender, email, contactNumber, address, status, expertise } = await req.json()

    if (!id) {
      return NextResponse.json({ message: "Instructor ID is required" }, { status: 400 })
    }

    const instructorPayload = {
      first_name: firstName,
      last_name: lastName,
      gender: parseSex(gender),
      email: email,
      status: status,
      updated_at: new Date().toISOString(),
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
        address: address || null,
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
