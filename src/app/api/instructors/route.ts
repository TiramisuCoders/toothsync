//app/api/instructors/route.ts
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { cookies } from "next/headers"

// Helper to parse gender string to match DB enum
const parseSex = (gender: string): "Male" | "Female" | "Other" => {
  const genderLower = gender.toLowerCase()
  if (genderLower === "male") return "Male"
  if (genderLower === "female") return "Female"
  return "Other"
}

// Helper function to generate password
const generatePassword = (firstName: string, lastName: string, contactNumber: string): string => {
  const firstInitial = firstName.charAt(0).toUpperCase()
  const lastInitial = lastName.charAt(0).toUpperCase()
  const lastFourDigits = contactNumber.replace(/\D/g, "").slice(-4)
  return `${firstInitial}${lastInitial}${lastFourDigits}`
}

// Helper to decode base64
function decodeBase64(str: string): string {
  try {
    return Buffer.from(str, 'base64').toString('utf-8')
  } catch (error) {
    console.error("Error decoding base64:", error)
    return str
  }
}

// Helper to get current user from session - simplified approach
async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    
    // Find the Supabase auth cookie
    const allCookies = cookieStore.getAll()
    const sbAuthCookie = allCookies.find(c => 
      c.name.startsWith('sb-') && c.name.includes('auth-token')
    )
    
    if (!sbAuthCookie) {
      console.log("No auth token found")
      return null
    }

    console.log("Found auth cookie:", sbAuthCookie.name)
    
    try {
      let cookieValue = sbAuthCookie.value
      
      // Check if it starts with "base64-" and decode if necessary
      if (cookieValue.startsWith('base64-')) {
        cookieValue = decodeBase64(cookieValue.substring(7))
      }
      
      // Now try to parse as JSON
      const authData = JSON.parse(cookieValue)
      const accessToken = authData?.access_token || authData?.access_token?.[0]
      
      if (!accessToken || typeof accessToken !== 'string') {
        console.log("No valid access token found in cookie")
        return null
      }

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)
      
      if (error) {
        console.error("Error verifying token:", error)
        return null
      }

      if (!user) {
        console.log("No user found from token")
        return null
      }

      // Get user details from users table
      const { data: userData, error: dbError } = await supabaseAdmin
        .from('users')
        .select('auth_user_id, email, role, first_name, last_name')
        .eq('auth_user_id', user.id)
        .single()

      if (dbError || !userData) {
        console.error("DB error:", dbError)
        return null
      }

      console.log("User found:", userData.email)
      return userData
    } catch (parseError) {
      console.error("Error parsing auth cookie:", parseError)
      return null
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Helper to check if user exists by email
async function getUserByEmail(email: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error("Error listing users:", error)
      return null
    }

    const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    return user || null
  } catch (error) {
    console.error("Error in getUserByEmail:", error)
    return null
  }
}

// Helper to map role code to role name
const mapRoleToName = (roleCode: string): string => {
  const roleMap: { [key: string]: string } = {
    'R01': 'clinician',
    'R02': 'clerk',
    'R03': 'clinical-instructor',
    'R04': 'chief-of-clinicians'
  }
  return roleMap[roleCode] || 'unknown'
}

// Helper to log activity
async function logActivity(
  userId: string,
  role: string,
  action: string,
  actionKey: string,
  details: any
) {
  try {
    const roleName = mapRoleToName(role)
    
    const { error } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: userId,
        role: roleName,
        action: action,
        action_key: actionKey,
        category: 'USER_ACTION',
        severity: actionKey.includes('archive') ? 'WARN' : 'INFO',
        details: JSON.stringify(details),
        ip_address: 'system',
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error logging activity:', error)
    } else {
      console.log('Activity logged successfully:', actionKey)
    }
  } catch (error) {
    console.error('Exception logging activity:', error)
  }
}

// GET /api/instructors - Fetch all instructors with their department specializations
export async function GET() {
  try {
    if (!supabaseAdmin) {
      console.error("Supabase admin client not available")
      return NextResponse.json(
        {
          message: "Database Configuration Required",
          error: "Server-side environment variables are missing.",
        },
        { status: 500 },
      )
    }

    // Test connection
    const { error: testError } = await supabaseAdmin
      .from("instructors")
      .select("instructor_id")
      .limit(1)

    if (testError) {
      console.error("Database connection test failed:", testError.message)
      return NextResponse.json(
        {
          message: "Database Connection Failed",
          error: `Cannot connect to database: ${testError.message}`,
        },
        { status: 500 },
      )
    }

    // Fetch all departments
    const { data: allDepartments, error: departmentsError } = await supabaseAdmin
      .from("departments")
      .select("id, name")

    if (departmentsError) {
      console.error("Error fetching departments:", departmentsError)
      return NextResponse.json(
        { message: "Error fetching departments", error: departmentsError.message },
        { status: 500 },
      )
    }

    const departmentMap = new Map()
    allDepartments?.forEach((dept: any) => {
      departmentMap.set(dept.id, dept.name)
    })

    // Fetch all procedures for each department
    const { data: allProcedures, error: proceduresError } = await supabaseAdmin
      .from("procedure")
      .select("procedure_id, name, department")

    if (proceduresError) {
      console.error("Error fetching procedures:", proceduresError)
      return NextResponse.json(
        { message: "Error fetching procedures", error: proceduresError.message },
        { status: 500 },
      )
    }

    // Group procedures by department
    const proceduresByDepartment = new Map()
    allProcedures?.forEach((proc: any) => {
      if (!proceduresByDepartment.has(proc.department)) {
        proceduresByDepartment.set(proc.department, [])
      }
      proceduresByDepartment.get(proc.department).push(proc.name)
    })

    // Fetch instructors - including archived ones
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

    // Fetch users
    const userIds = instructorsData?.map((instructor: any) => instructor.user_id) || []
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from("users")
      .select("auth_user_id, first_name, last_name, email, sex, contact_number")
      .in("auth_user_id", userIds)

    if (usersError) {
      console.error("Error fetching users data:", usersError)
      return NextResponse.json(
        { message: "Error fetching users data", error: usersError.message },
        { status: 500 },
      )
    }

    const userMap = new Map()
    usersData?.forEach((user: any) => {
      userMap.set(user.auth_user_id, user)
    })

    // Fetch specializations (departments)
    const instructorIds = instructorsData?.map((instructor: any) => instructor.instructor_id) || []
    const { data: allSpecializations, error: specializationsError } = await supabaseAdmin
      .from("Instructors_Specialization")
      .select("instructor_id, department")
      .in("instructor_id", instructorIds)

    if (specializationsError) {
      console.error("Error fetching specializations:", specializationsError)
      return NextResponse.json(
        { message: "Error fetching specializations", error: specializationsError.message },
        { status: 500 },
      )
    }

    // Group specializations by instructor
    const specializationsByInstructor = new Map()
    allSpecializations?.forEach((spec: any) => {
      if (!specializationsByInstructor.has(spec.instructor_id)) {
        specializationsByInstructor.set(spec.instructor_id, [])
      }
      specializationsByInstructor.get(spec.instructor_id).push(spec.department)
    })

    // Build response with all procedures from specialized departments
    const instructors =
      instructorsData?.map((instructor: any) => {
        const userData = userMap.get(instructor.user_id)
        const departmentIds = specializationsByInstructor.get(instructor.instructor_id) || []

        // Get all procedures from the departments this instructor specializes in
        const allProceduresForInstructor: string[] = []
        departmentIds.forEach((deptId: string) => {
          const procedures = proceduresByDepartment.get(deptId) || []
          allProceduresForInstructor.push(...procedures)
        })

        return {
          id: instructor.instructor_id.toString(),
          firstName: userData?.first_name || "",
          lastName: userData?.last_name || "",
          gender: userData?.sex || "Other",
          status: instructor.status === "Archived" ? "Not Available" : instructor.status || "Not Available",
          email: userData?.email || "",
          contactNumber: userData?.contact_number || "",
          expertise: allProceduresForInstructor,
          departments: departmentIds.map((id: string) => departmentMap.get(id)).filter(Boolean),
          archived: instructor.status === "Archived",
        }
      }) || []

    return NextResponse.json(instructors, { status: 200 })
  } catch (error: any) {
    console.error("Unexpected error in GET /api/instructors:", error)
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 },
    )
  }
}

// POST /api/instructors - Add a new instructor
export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          message: "Database Configuration Required",
          error: "Server-side environment variables are missing.",
        },
        { status: 500 },
      )
    }

    const { firstName, lastName, gender, email, contactNumber, status, expertise } = await req.json()

    if (!firstName || !lastName || !email || !gender || !status || !contactNumber) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      )
    }

    // Get current user for logging
    const currentUser = await getCurrentUser()
    console.log("Current user:", currentUser)
    
    if (!currentUser) {
      console.error("Unable to get current user - proceeding without activity log")
    }

    let authUserId: string | null = null
    let isNewAuthUser = false

    const generatedPassword = generatePassword(firstName, lastName, contactNumber)
    console.log(`Generated password for ${firstName} ${lastName}: ${generatedPassword}`)

    // Check if user already exists in auth using our helper
    const existingAuthUser = await getUserByEmail(email)

    if (existingAuthUser) {
      // User exists in auth, use their ID
      authUserId = existingAuthUser.id
      console.log(`User already exists in auth with ID: ${authUserId}`)
      
      // Update their password in case it needs to be reset
      const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(
        authUserId,
        { password: generatedPassword }
      )
      
      if (updatePasswordError) {
        console.error("Error updating password:", updatePasswordError)
      }
    } else {
      // Create new auth user
      const { data: newAuthUserData, error: newAuthUserError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: "R03"
        }
      })

      if (newAuthUserError) {
        console.error("Error creating auth user:", newAuthUserError)
        return NextResponse.json(
          { message: `Failed to create auth user: ${newAuthUserError.message}` },
          { status: 500 },
        )
      }

      if (!newAuthUserData?.user) {
        return NextResponse.json({ message: "Failed to create auth user - no user returned" }, { status: 500 })
      }

      authUserId = newAuthUserData.user.id
      isNewAuthUser = true
      console.log(`Created new auth user with ID: ${authUserId}`)
    }

    if (!authUserId) {
      return NextResponse.json({ message: "Failed to obtain auth user ID." }, { status: 500 })
    }

    // Prepare user payload with all required fields
    const now = new Date().toISOString()
    const userPayload = {
      auth_user_id: authUserId,
      first_name: firstName,
      last_name: lastName,
      email: email,
      sex: parseSex(gender),
      role: "R03",
      contact_number: contactNumber || null,
      updated_at: now  // Set updated_at
    }

    // Check if user exists in users table
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
      // Update existing user
      console.log(`Updating existing user in users table: ${authUserId}`)
      const { error: updateUserError } = await supabaseAdmin
        .from("users")
        .update(userPayload)
        .eq("auth_user_id", authUserId)
        
      if (updateUserError) {
        console.error("Error updating user:", updateUserError)
        return NextResponse.json({ message: `Failed to update user: ${updateUserError.message}` }, { status: 500 })
      }
    } else {
      // Insert new user
      console.log(`Inserting new user into users table: ${authUserId}`)
      const { error: insertUserError } = await supabaseAdmin
        .from("users")
        .insert([userPayload])
        
      if (insertUserError) {
        console.error("Error inserting user:", insertUserError)
        return NextResponse.json({ message: `Failed to insert user: ${insertUserError.message}` }, { status: 500 })
      }
    }

    // Generate instructor ID
    const randomSuffix = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0")
    const instructorId = Number.parseInt(`2022${randomSuffix}`)

    // Check if instructor already exists
    const { data: existingInstructor } = await supabaseAdmin
      .from("instructors")
      .select("instructor_id")
      .eq("user_id", authUserId)
      .single()

    if (existingInstructor) {
      return NextResponse.json(
        { message: "This user is already registered as an instructor" },
        { status: 400 },
      )
    }

    const instructorPayload = {
      user_id: authUserId,
      instructor_id: instructorId,
      status: status || "Available",
    }

    const { error: insertInstructorError } = await supabaseAdmin
      .from("instructors")
      .insert([instructorPayload])

    if (insertInstructorError) {
      console.error("Error inserting instructor:", insertInstructorError)
      return NextResponse.json(
        { message: `Failed to insert instructor: ${insertInstructorError.message}` },
        { status: 500 },
      )
    }

    console.log(`Successfully created instructor with ID: ${instructorId}`)

    // Handle expertise as procedure names - map them to departments
    if (expertise && expertise.length > 0) {
      const { data: proceduresData } = await supabaseAdmin
        .from("procedure")
        .select("department")
        .in("name", expertise)

      if (proceduresData && proceduresData.length > 0) {
        const uniqueDepartments = [...new Set(proceduresData.map((p: any) => p.department).filter(Boolean))]
        
        const specializationPayload = uniqueDepartments.map((deptId) => ({
          instructor_id: instructorId,
          department: deptId,
          ci_dept_id: `${instructorId}_${deptId}`,
        }))

        const { error: insertSpecializationError } = await supabaseAdmin
          .from("Instructors_Specialization")
          .insert(specializationPayload)

        if (insertSpecializationError) {
          console.error("Error inserting specializations:", insertSpecializationError)
        } else {
          console.log(`Added ${specializationPayload.length} specializations for instructor ${instructorId}`)
        }
      }
    }

    // Log the activity if we have a current user
    if (currentUser) {
      await logActivity(
        currentUser.auth_user_id,
        currentUser.role,
        `User ${currentUser.email} created instructor account for ${firstName} ${lastName} (${email})`,
        'instructors_insert',
        {
          admin_email: currentUser.email,
          admin_name: `${currentUser.first_name} ${currentUser.last_name}`,
          instructor_id: instructorId,
          instructor_name: `${firstName} ${lastName}`,
          instructor_email: email,
          status: status,
          expertise: expertise,
          is_new_auth_user: isNewAuthUser
        }
      )
    }

    return NextResponse.json({ 
      message: "Instructor added successfully!",
      instructorId: instructorId,
      authUserId: authUserId,
      isNewUser: isNewAuthUser,
      generatedPassword: generatedPassword // Include this in response for admin to share with instructor
    }, { status: 200 })
  } catch (error: any) {
    console.error("Unexpected error in POST /api/instructors:", error)
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 })
  }
}

// ... (PUT and DELETE methods remain the same as before)