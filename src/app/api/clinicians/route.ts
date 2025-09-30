import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

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

const generatePassword = (firstName: string, lastName: string, contactNumber: string): string => {
  const firstInitial = firstName.charAt(0).toUpperCase()
  const lastInitial = lastName.charAt(0).toUpperCase()
  const lastFourDigits = contactNumber.replace(/\D/g, "").slice(-4)
  return `${firstInitial}${lastInitial}${lastFourDigits}`
}

const getAcademicYearStatus = async (academicYearId: string): Promise<string> => {
  try {
    const { data, error } = await supabaseAdmin.from("academic_year").select("status").eq("id", academicYearId).single()

    if (error) {
      console.error("Error fetching academic year status:", error)
      return "inactive" // Default to inactive on error
    }

    return data?.status || "inactive"
  } catch (error) {
    console.error("Exception fetching academic year status:", error)
    return "inactive" // Default to inactive on error
  }
}

// GET /api/clinicians - Fetch all clinicians
export async function GET() {
  try {
    // Fetch clinician data directly from clinicians and users tables
    const { data: cliniciansData, error: cliniciansError } = await supabaseAdmin
      .from("clinicians")
      .select(
        `user_id, student_id, enrollment_status, year_level, section, users(first_name, last_name, email, sex, contact_number)`,
      )
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
      academicYearId, // Added academicYearId parameter
    } = await req.json()

    // Basic validation for fields that are required
    if (!firstName || !lastName || !email || !gender || !status || !studentId || !academicYearId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    if (!contactNumber || contactNumber.replace(/\D/g, "").length < 4) {
      return NextResponse.json(
        { message: "Contact number is required and must have at least 4 digits for password generation" },
        { status: 400 },
      )
    }

    const academicYearStatus = await getAcademicYearStatus(academicYearId)
    console.log(`Academic year status: ${academicYearStatus}`)

    // 1. Get or Create Auth User
    let authUserId: string | null = null
    let createdNewAuthUser = false

    const generatedPassword = generatePassword(firstName, lastName, contactNumber)
    const { data: newAuthUserData, error: newAuthUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: generatedPassword,
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

    let actualUserId: string | null = null

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
      // User exists, update it and get the user_id
      const { data: updatedUser, error: updateUserError } = await supabaseAdmin
        .from("users")
        .update(userPayload)
        .eq("auth_user_id", authUserId)
        .select("auth_user_id")
        .single()
      if (updateUserError) {
        console.error("Error updating user in public.users:", updateUserError)
        return NextResponse.json({ message: `Failed to update user: ${updateUserError.message}` }, { status: 500 })
      }
      actualUserId = updatedUser.auth_user_id
      console.log(`Successfully updated user ${firstName} ${lastName} in public.users with ID: ${actualUserId}`)
    } else {
      // User does not exist, insert it and get the user_id
      const { data: insertedUser, error: insertUserError } = await supabaseAdmin
        .from("users")
        .insert([userPayload])
        .select("auth_user_id")
        .single()
      if (insertUserError) {
        console.error("Error inserting user into public.users:", insertUserError)
        return NextResponse.json({ message: `Failed to insert user: ${insertUserError.message}` }, { status: 500 })
      }
      actualUserId = insertedUser.auth_user_id
      console.log(`Successfully inserted user ${firstName} ${lastName} into public.users with ID: ${actualUserId}`)
    }

    if (!actualUserId) {
      return NextResponse.json({ message: "Failed to obtain user ID from users table." }, { status: 500 })
    }

    // 3. Insert/Update into clinicians table
    const cliniciansPayload: any = {
      user_id: actualUserId,
      student_id: studentId,
      year_level: parseYearLevel(yearLevel),
      section: section,
      enrollment_status: parseEnrollmentStatus(status),
      updated_at: new Date().toISOString(),
    }

    const { data: existingClinician, error: fetchClinicianError } = await supabaseAdmin
      .from("clinicians")
      .select("user_id")
      .eq("user_id", actualUserId)
      .single()

    if (fetchClinicianError && fetchClinicianError.code !== "PGRST116") {
      console.error("Error checking existing clinician in clinicians:", fetchClinicianError)
      return NextResponse.json({ message: `Database error: ${fetchClinicianError.message}` }, { status: 500 })
    }

    if (existingClinician) {
      // Update existing clinician
      const { error: updateClinicianError } = await supabaseAdmin
        .from("clinicians")
        .update(cliniciansPayload)
        .eq("user_id", actualUserId)
      if (updateClinicianError) {
        console.error("Error updating clinician in clinicians:", updateClinicianError)
        return NextResponse.json(
          { message: `Failed to update clinician: ${updateClinicianError.message}` },
          { status: 500 },
        )
      }
    } else {
      // Insert new clinician
      const { error: insertClinicianError } = await supabaseAdmin.from("clinicians").insert([cliniciansPayload])
      if (insertClinicianError) {
        console.error("Error inserting clinician into clinicians:", insertClinicianError)
        return NextResponse.json(
          { message: `Failed to insert clinician: ${insertClinicianError.message}` },
          { status: 500 },
        )
      }
    }

    // 4. Insert/Update into clinician_records table
    const clinicianRecordsPayload = {
      user_id: actualUserId,
      student_id: studentId,
      year_level: parseYearLevel(yearLevel),
      section: section,
      academic_year_id: academicYearId,
    }

    const { data: existingRecord, error: fetchRecordError } = await supabaseAdmin
      .from("clinician_records")
      .select("user_id")
      .eq("user_id", actualUserId)
      .eq("academic_year_id", academicYearId)
      .single()

    if (fetchRecordError && fetchRecordError.code !== "PGRST116") {
      console.error("Error checking existing record in clinician_records:", fetchRecordError)
      return NextResponse.json({ message: `Database error: ${fetchRecordError.message}` }, { status: 500 })
    }

    if (existingRecord) {
      // Update existing record
      const { error: updateRecordError } = await supabaseAdmin
        .from("clinician_records")
        .update(clinicianRecordsPayload)
        .eq("user_id", actualUserId)
        .eq("academic_year_id", academicYearId)
      if (updateRecordError) {
        console.error("Error updating record in clinician_records:", updateRecordError)
        return NextResponse.json(
          { message: `Failed to update clinician record: ${updateRecordError.message}` },
          { status: 500 },
        )
      }
    } else {
      // Insert new record
      const { error: insertRecordError } = await supabaseAdmin
        .from("clinician_records")
        .insert([clinicianRecordsPayload])
      if (insertRecordError) {
        console.error("Error inserting record into clinician_records:", insertRecordError)
        return NextResponse.json(
          { message: `Failed to insert clinician record: ${insertRecordError.message}` },
          { status: 500 },
        )
      }
    }

    console.log(`Successfully inserted clinician ${firstName} ${lastName} into both clinicians and clinician_records`)
    return NextResponse.json(
      {
        message: "Clinician added successfully!",
        academicYearStatus: academicYearStatus,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Unexpected error in POST /api/clinicians:", error)
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 })
  }
}
