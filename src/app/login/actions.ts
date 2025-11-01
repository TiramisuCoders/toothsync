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

// Helper function to get client IP from request headers
async function getClientIp(): Promise<string> {
  const headersList = await headers();
  
  // Try various headers that might contain the client IP
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  const cfConnectingIp = headersList.get("cf-connecting-ip"); // Cloudflare
  const trueClientIp = headersList.get("true-client-ip"); // Cloudflare Enterprise
  
  // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2, ...)
  // We want the first one (the original client)
  if (forwardedFor) {
    const ips = forwardedFor.split(",");
    return ips[0].trim();
  }
  
  if (realIp) return realIp;
  if (cfConnectingIp) return cfConnectingIp;
  if (trueClientIp) return trueClientIp;
  
  return "unknown";
}

export async function loginAction(email: string, password: string, loginAsRole: string) {
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

  // Clear any existing session
  await supabase.auth.signOut();
  await supabase.auth.refreshSession();

  // Attempt sign in
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  const user = data.user;

  // --- Failed login ---
  if (error || !user) {
    // Try to get user ID for logging purposes
    const { data: existingUser } = await supabase
      .from("users")
      .select("auth_user_id")
      .eq("email", email)
      .single();

    // Log failed login attempt with client IP
    await logFailedLogin(email, loginAsRole, existingUser?.auth_user_id, clientIp);

    return { error: { message: "Invalid email or password." } };
  }

  // --- Fetch user role ---
  const { data: userRecord, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (roleError || !userRecord) {
    return { error: { message: "User role not found" } };
  }

  // --- Role validation ---
  const canLoginAs = (userRole: string, loginAs: string) =>
    userRole === loginAs || (userRole === "R02" && loginAs === "R01");

  if (!canLoginAs(userRecord.role, loginAsRole)) {
    // Log unauthorized access attempt with client IP
    await logUnauthorizedAccess(user.id, userRecord.role, email, loginAsRole, clientIp);

    const roleNameMap: Record<string, string> = {
      R01: "clinician",
      R02: "clerk",
      R03: "clinical instructor",
      R04: "chief of clinicians",
    };

    return {
      error: { 
        message: `Not authorized to log in as ${roleNameMap[loginAsRole] || "this role"}.` 
      },
    };
  }

  // --- Map role code to role name ---
  const roleMap: Record<string, string> = {
    R01: "clinician",
    R02: "clerk",
    R03: "clinical-instructor",
    R04: "chief-of-clinicians",
  };
  const roleName = roleMap[loginAsRole];

  // --- Log successful login with client IP ---
  await logSuccessfulLogin(user.id, roleName, email, clientIp);

  // --- Set role cookie ---
  cookieStore.delete("role");
  cookieStore.set("role", roleName, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  // Also store email in cookie for logout logging (optional but helpful)
  cookieStore.set("user_email", email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  // --- Redirect based on role ---
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
  const roleCookie = cookieStore.get("role");
  const emailCookie = cookieStore.get("user_email");

  // Log logout before clearing session with client IP
  if (user && roleCookie) {
    await logLogout(user.id, roleCookie.value, emailCookie?.value, clientIp);
  }

  // Clear session and cookies
  await supabase.auth.signOut();
  cookieStore.delete("role");
  cookieStore.delete("user_email");
  
  return { success: true };
}