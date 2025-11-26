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
  let identifierType: string;

  // ============================================================================
  // LOGIN FLOW:
  // 1. User enters student_id/instructor_id
  // 2. Find ID in appropriate table (clinicians/instructors/clerks)
  // 3. Get user_id (UUID) from that table
  // 4. Look up user_id in auth.users (via users table) to get email
  // 5. Authenticate with email + password against auth.users table
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
      .maybeSingle(); // Use maybeSingle() instead of single() to handle no results gracefully

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

    // Step 4: Use user_id to get email from users table (which links to auth.users)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email, role")
      .eq("auth_user_id", clinicianData.user_id)
      .maybeSingle();

    console.log('[LoginDebug] R01 - User lookup result:', { 
      found: !!userData, 
      error: userError?.message,
      email: userData?.email,
      role: userData?.role
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

    // Step 4: Use user_id to get email from users table (which links to auth.users)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email, role")
      .eq("auth_user_id", clinicianData.user_id)
      .single();

    if (userError || !userData) {
      await logFailedLogin(identifier, loginAsRole, clinicianData.user_id, clientIp);
      return { error: { message: `Invalid ${identifierType} or password.` } };
    }

    userEmail = userData.email;
    userId = clinicianData.user_id;
    userRole = userData.role;

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

    // Step 4: Use user_id to get email from users table (which links to auth.users)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email, role")
      .eq("auth_user_id", instructorData.user_id)
      .single();

    if (userError || !userData) {
      await logFailedLogin(identifier, loginAsRole, instructorData.user_id, clientIp);
      return { error: { message: `Invalid ${identifierType} or password.` } };
    }

    userEmail = userData.email;
    userId = instructorData.user_id;
    userRole = userData.role;

  } else {
    // CHIEF OF CLINICIANS LOGIN FLOW (R04)
    // =====================================
    identifierType = "email";
    
    // Direct lookup: email is entered, find in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email, auth_user_id, role")
      .eq("email", identifier)
      .single();

    if (userError || !userData) {
      await logFailedLogin(identifier, loginAsRole, undefined, clientIp);
      return { error: { message: `Invalid ${identifierType} or password.` } };
    }

    userEmail = userData.email;
    userId = userData.auth_user_id;
    userRole = userData.role;
  }

  // Step 5: Authenticate with auth.users using email + password
  // ============================================================
  // This verifies the password against the hash stored in auth.users table
  // The auth.users table is linked to users table via auth_user_id = auth.users.id
  
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
  const roleIdCookie = cookieStore.get("role_id"); // Get role_id instead of role name
  const identifierCookie = cookieStore.get("user_identifier");

  // Log logout with role_id
  if (user && roleIdCookie) {
    await logLogout(
      user.id,
      roleIdCookie.value, // This is now role_id (R01, R02, etc.)
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