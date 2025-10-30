import { supabaseAdmin } from '@/lib/supabase/admin'

interface CSVRow {
  'Student ID': string
  'First Name': string
  'Last Name': string
  'Email': string
  'Gender': string
  'Status': string
  'Year Level': string
  'Contact Number': string
  'Section': string
}

interface ProcessResult {
  success: boolean
  message: string
  processedCount: number
  skippedCount: number
  errors: string[]
}

function generatePassword(firstName: string, lastName: string, contactNumber: string): string {
  const firstInitial = firstName?.[0]?.toUpperCase() || 'X'
  const lastInitial = lastName?.[0]?.toUpperCase() || 'X'
  const digitsOnly = contactNumber.replace(/\D/g, '')
  const lastFour = digitsOnly.slice(-4).padStart(4, '0')
  return `${firstInitial}${lastInitial}${lastFour}`
}

function parseSex(gender: string): 'Male' | 'Female' | 'Other' {
  const normalized = gender.toLowerCase().trim()
  if (normalized === 'male') return 'Male'
  if (normalized === 'female') return 'Female'
  return 'Other'
}

function parseEnrollmentStatus(status: string): 'Enrolled' | 'Not Enrolled' {
  const normalized = status.toLowerCase().trim()
  if (['enrolled', 'active', 'current'].includes(normalized)) {
    return 'Enrolled'
  }
  return 'Not Enrolled'
}

function parseYearLevel(yearLevel: string): string {
  const normalized = yearLevel.toLowerCase().trim()
  if (normalized.includes('1')) return '1st Year'
  if (normalized.includes('2')) return '2nd Year'
  if (normalized.includes('3')) return '3rd Year'
  if (normalized.includes('4')) return '4th Year'
  if (normalized.includes('5')) return '5th Year'
  return '5th Year'
}

async function getOrCreateAuthUser(email: string, password: string): Promise<{ authUserId: string | null; createdNew: boolean }> {
  try {
    // Try to list users and find existing one
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    
    const existingUser = users?.users?.find(u => u.email === email)
    
    if (existingUser) {
      console.log(`Found existing auth user: ${email} with ID: ${existingUser.id}`)
      return { authUserId: existingUser.id, createdNew: false }
    }

    // Create new user
    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) {
      console.error(`Failed to create auth user for ${email}:`, error.message)
      return { authUserId: null, createdNew: false }
    }

    if (newUser.user) {
      console.log(`Successfully created new auth user: ${email} with ID: ${newUser.user.id}`)
      return { authUserId: newUser.user.id, createdNew: true }
    }

    return { authUserId: null, createdNew: false }
  } catch (error) {
    console.error(`Error in getOrCreateAuthUser for ${email}:`, error)
    return { authUserId: null, createdNew: false }
  }
}

export async function processClinicianCSV(
  rows: CSVRow[],
  academicYearId: string
): Promise<ProcessResult> {
  let processedCount = 0
  let skippedCount = 0
  const errors: string[] = []

  console.log(`Processing ${rows.length} rows for academic year: ${academicYearId}`)

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // Account for header row

    try {
      // Extract and clean data
      const studentId = row['Student ID']?.trim()
      const firstName = row['First Name']?.trim()
      const lastName = row['Last Name']?.trim()
      const email = row['Email']?.trim()
      const gender = row['Gender']?.trim()
      const enrollmentStatus = row['Status']?.trim()
      const yearLevelRaw = row['Year Level']?.trim()
      const contactNumber = row['Contact Number']?.trim()
      const section = row['Section']?.trim()

      // Validate required fields
      if (!studentId || !firstName || !lastName || !email || !gender || !enrollmentStatus || !contactNumber) {
        const error = `Row ${rowNum}: Missing required data`
        console.error(error)
        errors.push(error)
        skippedCount++
        continue
      }

      // Parse and format data
      const parsedGender = parseSex(gender)
      const parsedYearLevel = parseYearLevel(yearLevelRaw)
      const parsedEnrollmentStatus = parseEnrollmentStatus(enrollmentStatus)
      const generatedPassword = generatePassword(firstName, lastName, contactNumber)

      console.log(`Row ${rowNum}: Processing ${firstName} ${lastName} (${email})`)
      console.log(`Generated password: ${generatedPassword}`)

      // Get or create auth user
      const { authUserId, createdNew } = await getOrCreateAuthUser(email, generatedPassword)

      if (!authUserId) {
        const error = `Row ${rowNum}: Could not obtain auth user ID for ${email}`
        console.error(error)
        errors.push(error)
        skippedCount++
        continue
      }

      // 1. Handle public.users table (Insert or Update)
      const userPayload = {
        auth_user_id: authUserId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        sex: parsedGender,
        role: 'R01',
        contact_number: contactNumber || null,
      }

      try {
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('auth_user_id')
          .eq('auth_user_id', authUserId)
          .limit(1)
          .single()

        if (existingUser) {
          console.log(`Updating existing user: ${email}`)
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update(userPayload)
            .eq('auth_user_id', authUserId)

          if (updateError) throw updateError
        } else {
          console.log(`Inserting new user: ${email}`)
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert([userPayload])

          if (insertError) throw insertError
        }
      } catch (dbError: any) {
        const error = `Row ${rowNum}: Database error for users table: ${dbError.message}`
        console.error(error)
        errors.push(error)
        skippedCount++
        continue
      }

      // 2. Handle clinicians table
      const clinicianPayload = {
        user_id: authUserId,
        student_id: studentId,
        enrollment_status: parsedEnrollmentStatus,
        year_level: parsedYearLevel,
        section: section || null,
        academic_year_id: academicYearId,
        updated_at: new Date().toISOString(),
      }

      try {
        const { data: existingClinician } = await supabaseAdmin
          .from('clinicians')
          .select('user_id')
          .eq('user_id', authUserId)
          .limit(1)
          .single()

        if (existingClinician) {
          console.log(`Updating existing clinician: ${firstName} ${lastName}`)
          const { error: updateError } = await supabaseAdmin
            .from('clinicians')
            .update(clinicianPayload)
            .eq('user_id', authUserId)

          if (updateError) throw updateError
        } else {
          console.log(`Inserting new clinician: ${firstName} ${lastName}`)
          const { error: insertError } = await supabaseAdmin
            .from('clinicians')
            .insert([clinicianPayload])

          if (insertError) throw insertError
        }
      } catch (dbError: any) {
        const error = `Row ${rowNum}: Database error for clinicians table: ${dbError.message}`
        console.error(error)
        errors.push(error)
        skippedCount++
        continue
      }

      // 3. Handle clinician_records table
      const clinicianRecordPayload = {
        user_id: authUserId,
        academic_year_id: academicYearId,
        student_id: studentId,
        year_level: parsedYearLevel,
        section: section || null,
        created_at: new Date().toISOString(),
      }

      try {
        const { data: existingRecord } = await supabaseAdmin
          .from('clinician_records')
          .select('user_id')
          .eq('user_id', authUserId)
          .eq('academic_year_id', academicYearId)
          .limit(1)
          .single()

        if (existingRecord) {
          console.log(`Clinician record already exists for ${firstName} ${lastName} in academic year ${academicYearId}`)
        } else {
          console.log(`Inserting clinician record: ${firstName} ${lastName}`)
          const { error: insertError } = await supabaseAdmin
            .from('clinician_records')
            .insert([clinicianRecordPayload])

          if (insertError) throw insertError
        }
      } catch (dbError: any) {
        const error = `Row ${rowNum}: Database error for clinician_records table: ${dbError.message}`
        console.error(error)
        errors.push(error)
        skippedCount++
        continue
      }

      processedCount++
      console.log(`Row ${rowNum}: Successfully processed`)

    } catch (error: any) {
      const errorMsg = `Row ${rowNum}: Unexpected error: ${error.message}`
      console.error(errorMsg)
      errors.push(errorMsg)
      skippedCount++
    }
  }

  const message = `Finished processing CSV. Total clinicians processed: ${processedCount}, Skipped: ${skippedCount}`
  console.log(message)

  return {
    success: skippedCount === 0,
    message,
    processedCount,
    skippedCount,
    errors,
  }
}