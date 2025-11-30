// app/login/actions.ts
"use server";

import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import {
  logSuccessfulLogin,
  logFailedLogin,
  logUnauthorizedAccess,
  logLogout,
} from "@/app/utils/activityLogger";

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  const cfConnectingIp = headersList.get("cf-connecting-ip");
  const trueClientIp = headersList.get("true-client-ip");

  if (forwardedFor) {
    const ips = forwardedFor.split(",");
    return ips[0].trim();
  }

  return realIp || cfConnectingIp || trueClientIp || "unknown";
}

// Helper function to check if account should be inactive based on academic year
// Helper function to check if account should be inactive based on academic year
async function checkAndDeactivateIfExpired(
  supabase: any,
  userId: string,
  studentId?: string
): Promise<{ isInactive: boolean; reason?: string; academicYear?: string }> {
  
  // Only check for students (clinicians/clerks)
  if (!studentId) {
    return { isInactive: false };
  }

  console.log('[StatusCheck] Checking expiration for:', { userId, studentId });

  // Get academic year by joining clinician_records with academic_year table
  const { data: recordWithYear, error: recordError } = await supabase
    .from("clinician_records")
    .select(`
      academic_year_id,
      academic_year (
        academic_year
      )
    `)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false }) // Get most recent record
    .limit(1)
    .maybeSingle();

  console.log('[StatusCheck] Clinician record lookup:', {
    found: !!recordWithYear,
    error: recordError?.message,
    raw_data: recordWithYear
  });

  if (recordError || !recordWithYear || !recordWithYear.academic_year?.academic_year) {
    // If no academic year found, allow login (shouldn't happen in normal flow)
    console.log('[StatusCheck] No academic year found, allowing login');
    return { isInactive: false };
  }

  const academicYear = recordWithYear.academic_year.academic_year; // e.g., "2014-2015"
  
  console.log('[StatusCheck] Found academic year:', academicYear);

  // Parse academic year (e.g., "2014-2015" -> 2015)
  const yearParts = academicYear.split('-');
  const endYear = parseInt(yearParts[1] || yearParts[0]);
  const currentYear = new Date().getFullYear();

  console.log('[StatusCheck] Year comparison:', {
    academicYear,
    endYear,
    currentYear,
    difference: currentYear - endYear,
    shouldBeInactive: endYear < currentYear - 1
  });

  // Check if more than 1 year old
  // Example: If current year is 2025 and academic year end is 2015
  // 2015 < 2024 (2025 - 1) = true -> should be inactive
  if (endYear < currentYear - 1) {
    console.log('[StatusCheck] Account should be inactive, deactivating now');
    
    // Auto-deactivate the account
    const { error: updateError } = await supabase
      .from("users")
      .update({ 
        status: "inactive",
        updated_at: new Date().toISOString()
      })
      .eq("auth_user_id", userId);

    if (updateError) {
      console.error('[StatusCheck] Error updating user status:', updateError);
    } else {
      console.log('[StatusCheck] Successfully updated user status to inactive');
    }

    // Log the auto-deactivation using RPC
    try {
      const clientIp = await getClientIp();
      await supabase.rpc("log_activity", {
        p_user_id: userId,
        p_action: "account_auto_deactivated",
        p_details: JSON.stringify({
          academic_year: academicYear,
          student_id: studentId,
          reason: "Enrollment period expired (more than 1 year old)"
        }),
        p_status: "success",
        p_ip_address: clientIp
      });
      console.log('[StatusCheck] Successfully logged deactivation');
    } catch (logError) {
      console.error('[StatusCheck] Error logging deactivation:', logError);
    }

    return { 
      isInactive: true, 
      reason: "enrollment_expired",
      academicYear 
    };
  }

  console.log('[StatusCheck] Account is still valid');
  return { isInactive: false };
}

export async function loginAction(
  identifier: string, // student_id, employee_id, or email
  password: string,
  loginAsRole: string
) {
  console.log('[LoginDebug] Login attempt:', {
    identifier,
    hasPassword: !!password,
    passwordLength: password?.length,
    loginAsRole
  });

  const cookieStore = await cookies();
  const clientIp = await getClientIp();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  await supabase.auth.signOut();
  await supabase.auth.refreshSession();

  let userEmail: string | null = null;
  let userId: string | null = null;
  let userRole: string | null = null;
  let userStatus: string | null = null;
  let studentId: string | null = null; // Track student_id for academic year check
  let identifierType: string;

  // ============================================================================
  // LOGIN FLOW:
  // 1. User enters student_id/instructor_id
  // 2. Find ID in appropriate table (clinicians/instructors/clerks)
  // 3. Get user_id (UUID) from that table
  // 4. Look up user_id in auth.users (via users table) to get email + status
  // 5. Check if account is inactive
  // 6. Authenticate with email + password against auth.users table
  // ============================================================================

  if (loginAsRole === "R01") {
    // CLINICIAN LOGIN FLOW
    // ====================
    identifierType = "student ID";
    
    console.log('[LoginDebug] R01 - Looking up student_id:', identifier);
    
    // Step 1-3: Find student_id in clinicians table, get user_id (UUID)
    const { data: clinicianData, error: clinicianError } = await supabase
      .from("clinicians")
      .select("user_id, student_id")
      .eq("student_id", identifier)
      .maybeSingle();

    console.log('[LoginDebug] R01 - Clinician lookup result:', { 
      found: !!clinicianData, 
      error: clinicianError?.message,
      user_id: clinicianData?.user_id,
      student_id: clinicianData?.student_id
    });

    if (clinicianError) {
      console.log('[LoginDebug] R01 - Database error:', clinicianError);
      await logFailedLogin(identifier, loginAsRole, undefined, clientIp);
      return { error: { message: `Database error. Please contact support.` } };
    }

    if (!clinicianData) {
      console.log('[LoginDebug] R01 - Failed: student_id not found in clinicians table');
      await logFailedLogin(identifier, loginAsRole, undefined, clientIp);
      return { error: { message: `Invalid ${identifierType} or password.` } };
    }

    // Step 4: Use user_id to get email + status from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email, role, status")
      .eq("auth_user_id", clinicianData.user_id)
      .maybeSingle();

    console.log('[LoginDebug] R01 - User lookup result:', { 
      found: !!userData, 
      error: userError?.message,
      email: userData?.email,
      role: userData?.role,
      status: userData?.status
    });

    if (userError) {
      console.log('[LoginDebug] R01 - Database error fetching user');
      await logFailedLogin(identifier, loginAsRole, clinicianData.user_id, clientIp);
      return { error: { message: `Database error. Please contact support.` } };
    }

    if (!userData) {
      console.log('[LoginDebug] R01 - Failed: user_id not found in users table');
      await logFailedLogin(identifier, loginAsRole, clinicianData.user_id, clientIp);
      return { error: { message: `Invalid ${identifierType} or password.` } };
    }

    userEmail = userData.email;
    userId = clinicianData.user_id;
    userRole = userData.role;
    userStatus = userData.status || "active"; // Default to active if null
    studentId = clinicianData.student_id;

  } else if (loginAsRole === "R02") {
    // CLERK LOGIN FLOW
    // ================
    identifierType = "student ID";
    
    // Step 1-3: Find student_id in clinicians table, get user_id (UUID)
    const { data: clinicianData, error: clinicianError } = await supabase
      .from("clinicians")
      .select("user_id, student_id")
      .eq("student_id", identifier)
      .single();

    if (clinicianError || !clinicianData) {
      await logFailedLogin(identifier, loginAsRole, undefined, clientIp);
      return { error: { message: `Invalid ${identifierType} or password.` } };
    }

    // Additional verification: Must exist in clerks table
    const { data: clerkData, error: clerkError } = await supabase
      .from("clerks")
      .select("user_id")
      .eq("user_id", clinicianData.user_id)
      .single();

    if (clerkError || !clerkData) {
      await logFailedLogin(identifier, loginAsRole, clinicianData.user_id, clientIp);
      return { error: { message: "Not authorized to log in as clerk." } };
    }

    // Step 4: Use user_id to get email + status from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email, role, status")
      .eq("auth_user_id", clinicianData.user_id)
      .single();

    if (userError || !userData) {
      await logFailedLogin(identifier, loginAsRole, clinicianData.user_id, clientIp);
      return { error: { message: `Invalid ${identifierType} or password.` } };
    }

    userEmail = userData.email;
    userId = clinicianData.user_id;
    userRole = userData.role;
    userStatus = userData.status || "active";
    studentId = clinicianData.student_id;

  } else if (loginAsRole === "R03") {
    // CLINICAL INSTRUCTOR LOGIN FLOW
    // ===============================
    identifierType = "instructor ID";
    
    // Step 1-3: Find instructor_id in instructors table, get user_id (UUID)
    const { data: instructorData, error: instructorError } = await supabase
      .from("instructors")
      .select("user_id, instructor_id")
      .eq("instructor_id", parseInt(identifier))
      .single();

    if (instructorError || !instructorData) {
      await logFailedLogin(identifier, loginAsRole, undefined, clientIp);
      return { error: { message: `Invalid ${identifierType} or password.` } };
    }

    // Step 4: Use user_id to get email + status from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email, role, status")
      .eq("auth_user_id", instructorData.user_id)
      .single();

    if (userError || !userData) {
      await logFailedLogin(identifier, loginAsRole, instructorData.user_id, clientIp);
      return { error: { message: `Invalid ${identifierType} or password.` } };
    }

    userEmail = userData.email;
    userId = instructorData.user_id;
    userRole = userData.role;
    userStatus = userData.status || "active";
    // Instructors don't have student_id, so studentId remains null

  } else {
    // CHIEF OF CLINICIANS LOGIN FLOW (R04)
    // =====================================
    identifierType = "email";
    
    // Direct lookup: email is entered, find in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email, auth_user_id, role, status")
      .eq("email", identifier)
      .single();

    if (userError || !userData) {
      await logFailedLogin(identifier, loginAsRole, undefined, clientIp);
      return { error: { message: `Invalid ${identifierType} or password.` } };
    }

    userEmail = userData.email;
    userId = userData.auth_user_id;
    userRole = userData.role;
    userStatus = userData.status || "active";
    // Chief doesn't have student_id, so studentId remains null
  }
// ============================================================================
  // ACCOUNT STATUS CHECK (NEW SECURITY FEATURE)
  // ============================================================================
  
  console.log('[LoginDebug] Pre-status check:', {
    userId,
    userStatus,
    studentId,
    role: loginAsRole
  });

  // First, check if account is already marked inactive
  if (userStatus === "inactive") {
    console.log('[LoginDebug] Account is already marked inactive in database');
    await logFailedLogin(identifier, loginAsRole, userId || undefined, clientIp);
    
    return { 
      error: { 
        message: "Your account has been deactivated. Please contact the administrator for assistance." 
      } 
    };
  }

  // For students (clinicians/clerks), check if enrollment has expired
  if (studentId && userId) {
    console.log('[LoginDebug] Checking enrollment expiration for student:', studentId);
    
    const expirationCheck = await checkAndDeactivateIfExpired(
      supabase,
      userId,
      studentId
    );

    console.log('[LoginDebug] Expiration check result:', expirationCheck);

    if (expirationCheck.isInactive) {
      console.log('[LoginDebug] Account auto-deactivated due to expired enrollment');
      await logFailedLogin(identifier, loginAsRole, userId, clientIp);
      
      return { 
        error: { 
          message: `Your enrollment period has expired (Academic Year: ${expirationCheck.academicYear}). Your account has been deactivated. Please contact the administrator if you need assistance.` 
        } 
      };
    }
  } else {
    console.log('[LoginDebug] Skipping expiration check - not a student or missing data');
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================
  // Step 5: Authenticate with auth.users using email + password
  // This verifies the password against the hash stored in auth.users table
  
  console.log('[LoginDebug] Attempting authentication with:', {
    email: userEmail,
    hasPassword: !!password,
    userId: userId,
    role: userRole
  });
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password,
  });
  const user = data.user;

  console.log('[LoginDebug] Authentication result:', {
    success: !!user,
    error: error?.message,
    userId: user?.id
  });

  // Failed login
  if (error || !user) {
    console.log('[LoginDebug] Failed: Authentication error -', error?.message);
    await logFailedLogin(identifier, loginAsRole, userId || undefined, clientIp);
    return { error: { message: `Invalid ${identifierType} or password.` } };
  }

  // Role validation
  const canLoginAs = (actualRole: string, attemptedRole: string) =>
    actualRole === attemptedRole || (actualRole === "R02" && attemptedRole === "R01");

  if (!canLoginAs(userRole!, loginAsRole)) {
    // Log unauthorized access with role_ids
    await logUnauthorizedAccess(
      user.id,
      userRole!, // Actual role_id
      identifier,
      loginAsRole, // Attempted role_id
      clientIp
    );

    const roleNameMap: Record<string, string> = {
      R01: "clinician",
      R02: "clerk",
      R03: "clinical instructor",
      R04: "chief of clinicians",
    };

    return {
      error: {
        message: `Not authorized to log in as ${
          roleNameMap[loginAsRole] || "this role"
        }.`,
      },
    };
  }

  // Map role code to role name for cookie
  const roleMap: Record<string, string> = {
    R01: "clinician",
    R02: "clerk",
    R03: "clinical-instructor",
    R04: "chief-of-clinicians",
  };
  const roleName = roleMap[loginAsRole];

  // Log successful login with role_id
  await logSuccessfulLogin(
    user.id,
    loginAsRole, // Pass role_id instead of role name
    identifier,
    clientIp
  );

  // Set cookies
  cookieStore.delete("role");
  cookieStore.set("role", roleName, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  // Store role_id for logout logging
  cookieStore.set("role_id", loginAsRole, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  cookieStore.set("user_identifier", identifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  // Redirect
  const redirectMap: Record<string, string> = {
    R01: "/dashboard/clinician",
    R02: "/dashboard/clerk",
    R03: "/dashboard/clinical-instructor",
    R04: "/dashboard/chief-of-clinicians",
  };

  const redirectPath = redirectMap[loginAsRole];
  if (redirectPath) redirect(redirectPath);

  return { success: true, role: roleName };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const clientIp = await getClientIp();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const roleIdCookie = cookieStore.get("role_id");
  const identifierCookie = cookieStore.get("user_identifier");

  // Log logout with role_id
  if (user && roleIdCookie) {
    await logLogout(
      user.id,
      roleIdCookie.value,
      identifierCookie?.value,
      clientIp
    );
  }

  await supabase.auth.signOut();
  cookieStore.delete("role");
  cookieStore.delete("role_id");
  cookieStore.delete("user_identifier");

  return { success: true };
}