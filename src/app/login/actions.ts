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
  email: string,
  password: string,
  loginAsRole: string
) {
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  const user = data.user;

  // Failed login
  if (error || !user) {
    const { data: existingUser } = await supabase
      .from("users")
      .select("auth_user_id")
      .eq("email", email)
      .single();

    // Log failed login with role_id instead of role name
    await logFailedLogin(
      email,
      loginAsRole, // This is the role_id (R01, R02, etc.)
      existingUser?.auth_user_id,
      clientIp
    );

    return { error: { message: "Invalid email or password." } };
  }

  // Fetch user role
  const { data: userRecord, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (roleError || !userRecord) {
    return { error: { message: "User role not found" } };
  }

  // Role validation
  const canLoginAs = (userRole: string, loginAs: string) =>
    userRole === loginAs || (userRole === "R02" && loginAs === "R01");

  if (!canLoginAs(userRecord.role, loginAsRole)) {
    // Log unauthorized access with role_ids
    await logUnauthorizedAccess(
      user.id,
      userRecord.role, // Actual role_id
      email,
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
    email,
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

  cookieStore.set("user_email", email, {
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
  const emailCookie = cookieStore.get("user_email");

  // Log logout with role_id
  if (user && roleIdCookie) {
    await logLogout(
      user.id,
      roleIdCookie.value, // This is now role_id (R01, R02, etc.)
      emailCookie?.value,
      clientIp
    );
  }

  await supabase.auth.signOut();
  cookieStore.delete("role");
  cookieStore.delete("role_id");
  cookieStore.delete("user_email");

  return { success: true };
}