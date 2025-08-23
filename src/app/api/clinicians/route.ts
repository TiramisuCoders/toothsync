import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { v4 as uuidv4 } from "uuid" // For generating temporary passwords

// Helper to parse gender string to match DB enum
const parseSex = (gender: string): "Male" | "Female" | "Other" => {
  const genderLower = gender.toLowerCase()
  if (genderLower === "male") return "Male"
  if (genderLower === "female") return "Female"
  return "Other"
}

// Helper to parse enrollment status to match DB enum
const parseEnrollmentStatus = (status: string): string => {
  const statusLower = status.toLowerCase()
  if (statusLower === "enrolled") return "Enrolled"
  if (statusLower === "not-enrolled" || statusLower === "not enrolled") return "Not Enrolled"
  return "Not Enrolled" // Default fallback
}

// Helper to parse year level string (if needed, otherwise just return as is)
const parseYearLevel = (yearLevel: string): string => {
  // This helper might be simplified if yearLevel is always stored exactly as received
  if (yearLevel.includes("5th")) return "5th Year"
  if (yearLevel.includes("6th")) return "6th Year"
  return yearLevel // Fallback for other values
}

// GET /api/clinicians - Fetch all clinicians
export async function GET() {
  try {
    // Fetch clinician data directly from clinicians and users tables
    const { data: cliniciansData, error: cliniciansError } = await supabaseAdmin
      .from("clinicians")
      .select(`
          user_id,
          student_id,
          enrollment_status,
          year_level,
          section,
          users(first_name, last_name, email, sex, contact_number)
        `)
      .order("user_id", { ascending: true })

    if (cliniciansError) {
      console.error("Error fetching clinicians data:", cliniciansError)
      return NextResponse.json(
        { message: "Error fetching clinicians data", error: cliniciansError.message },
        { status: 500 },
      )
    }

    // Map to frontend interface
    const clinicians = cliniciansData.map((c: any) => {
      return {
        id: c.user_id, // Keep user_id as internal ID
        studentId: c.student_id || "",
        firstName: c.users?.first_name || "",
        lastName: c.users?.last_name || "",
        gender: c.users?.sex || "Other",
        status: c.enrollment_status || "Not Enrolled",
        email: c.users?.email || "",
        contactNumber: c.users?.contact_number || "",
        yearLevel: c.year_level || "", // Now from public.clinicians
        section: c.section || "", // Now from public.clinicians
      }
    })

    return NextResponse.json(clinicians, { status: 200 })
  } catch (error: any) {
    console.error("Unexpected error in GET /api/clinicians:", error)
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 })
  }
}

// POST /api/clinicians - Add a new clinician
export async function POST(req: Request) {
  try {
    // Destructure all fields from the request body
    const {
      firstName,
      lastName,
      gender,
      email,
      contactNumber,
      yearLevel, // Now handled in clinicians table
      section, // Now handled in clinicians table
      status,
      studentId,
    } = await req.json()

    // Basic validation for fields that are required
    if (!firstName || !lastName || !email || !gender || !status || !studentId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // 1. Get or Create Auth User
    let authUserId: string | null = null
    let createdNewAuthUser = false

    // Try to create a new auth user
    const tempPassword = uuidv4() // Generate a temporary password
    const { data: newAuthUserData, error: newAuthUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Set to true if you want to auto-confirm
    })

    if (newAuthUserError) {
      // If user creation failed, check if it's because the user already exists
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
          console.log(`Found existing auth user: ${email} with ID: ${authUserId}`)
        } else {
          return NextResponse.json(
            { message: `Auth user already exists but could not be retrieved: ${newAuthUserError.message}` },
            { status: 409 },
          )
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
      createdNewAuthUser = true
      console.log(`Successfully created new auth user: ${email} with ID: ${authUserId}`)
    }

    if (!authUserId) {
      return NextResponse.json({ message: "Failed to obtain auth user ID." }, { status: 500 })
    }

    // 2. Insert/Update into public.users table
    const userPayload = {
      auth_user_id: authUserId,
      first_name: firstName,
      last_name: lastName,
      email: email,
      sex: parseSex(gender),
      role: "R01", // Assuming 'R01' is the role_id for clinicians
      contact_number: contactNumber || null,
    }

    const { data: existingUser, error: fetchUserError } = await supabaseAdmin
      .from("users")
      .select("auth_user_id")
      .eq("auth_user_id", authUserId)
      .single()

    if (fetchUserError && fetchUserError.code !== "PGRST116") {
      // PGRST116 means "no rows found"
      console.error("Error checking existing user in public.users:", fetchUserError)
      return NextResponse.json({ message: `Database error: ${fetchUserError.message}` }, { status: 500 })
    }

    if (existingUser) {
      // User exists, update it
      const { error: updateUserError } = await supabaseAdmin
        .from("users")
        .update(userPayload)
        .eq("auth_user_id", authUserId)
      if (updateUserError) {
        console.error("Error updating user in public.users:", updateUserError)
        return NextResponse.json({ message: `Failed to update user: ${updateUserError.message}` }, { status: 500 })
      }
      console.log(`Successfully updated user ${firstName} ${lastName} in public.users`)
    } else {
      // User does not exist, insert it
      const { error: insertUserError } = await supabaseAdmin.from("users").insert([userPayload])
      if (insertUserError) {
        console.error("Error inserting user into public.users:", insertUserError)
        return NextResponse.json({ message: `Failed to insert user: ${insertUserError.message}` }, { status: 500 })
      }
      console.log(`Successfully inserted user ${firstName} ${lastName} into public.users`)
    }

    // 3. Insert/Update into public.clinicians table
    const clinicianPayload = {
      user_id: authUserId,
      student_id: studentId,
      enrollment_status: parseEnrollmentStatus(status),
      year_level: parseYearLevel(yearLevel), // Year level now stored in clinicians table
      section: section, // Section now stored in clinicians table
      updated_at: new Date().toISOString(),
    }

    const { data: existingClinician, error: fetchClinicianError } = await supabaseAdmin
      .from("clinicians")
      .select("user_id")
      .eq("user_id", authUserId)
      .single()

    if (fetchClinicianError && fetchClinicianError.code !== "PGRST116") {
      console.error("Error checking existing clinician:", fetchClinicianError)
      return NextResponse.json({ message: `Database error: ${fetchClinicianError.message}` }, { status: 500 })
    }

    if (existingClinician) {
      // Clinician exists, update it
      const { error: updateClinicianError } = await supabaseAdmin
        .from("clinicians")
        .update(clinicianPayload)
        .eq("user_id", authUserId)
      if (updateClinicianError) {
        console.error("Error updating clinician:", updateClinicianError)
        return NextResponse.json(
          { message: `Failed to update clinician: ${updateClinicianError.message}` },
          { status: 500 },
        )
      }
      console.log(`Successfully updated clinician ${firstName} ${lastName}`)
    } else {
      // Clinician does not exist, insert it
      const { error: insertClinicianError } = await supabaseAdmin.from("clinicians").insert([clinicianPayload])
      if (insertClinicianError) {
        console.error("Error inserting clinician:", insertClinicianError)
        return NextResponse.json(
          { message: `Failed to insert clinician: ${insertClinicianError.message}` },
          { status: 500 },
        )
      }
      console.log(`Successfully inserted clinician ${firstName} ${lastName}`)
    }

    // No longer interacting with public.clinician_records or academic_year for clinician details

    return NextResponse.json({ message: "Clinician added/updated successfully!" }, { status: 200 })
  } catch (error: any) {
    console.error("Unexpected error in POST /api/clinicians:", error)
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 })
  }
}
