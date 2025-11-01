// app/login/actions.ts - DEBUG VERSION
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

// Helper to check if IP is private/internal
function isPrivateIP(ip: string): boolean {
  const cleanIP = ip.replace(/^\[|\]$/g, '');
  
  if (cleanIP.startsWith('10.')) return true;
  if (cleanIP.startsWith('172.')) {
    const second = parseInt(cleanIP.split('.')[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (cleanIP.startsWith('192.168.')) return true;
  if (cleanIP.startsWith('127.')) return true;
  if (cleanIP === '::1') return true;
  if (cleanIP.startsWith('::ffff:127.')) return true;
  if (cleanIP.startsWith('fc00:')) return true;
  if (cleanIP.startsWith('fd00:')) return true;
  
  return false;
}

// DEBUG VERSION - Logs all headers
async function getClientIp(): Promise<string> {
  const headersList = await headers();
  
  // LOG ALL HEADERS FOR DEBUGGING
  console.log("==========================================");
  console.log("🔍 DEBUGGING IP DETECTION");
  console.log("==========================================");
  console.log("ALL HEADERS:");
  headersList.forEach((value, key) => {
    console.log(`  ${key}: ${value}`);
  });
  console.log("==========================================");
  
  // Platform-specific headers (in order of priority)
  const ipHeaders = [
    'x-nf-client-connection-ip',  // Netlify
    'x-forwarded-for',            // Standard
    'cf-connecting-ip',           // Cloudflare
    'true-client-ip',             // Cloudflare Enterprise
    'x-real-ip',                  // Vercel
    'x-client-ip',                // AWS
    'x-forwarded',
    'forwarded-for',
    'forwarded',
  ];
  
  console.log("CHECKING HEADERS IN ORDER:");
  
  // Try each header in order
  for (const header of ipHeaders) {
    const value = headersList.get(header);
    console.log(`  ${header}: ${value || '(not found)'}`);
    
    if (value) {
      // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
      if (header === 'x-forwarded-for' || header === 'forwarded-for') {
        const ips = value.split(',');
        console.log(`    → Split into: [${ips.join(', ')}]`);
        const clientIp = ips[0].trim();
        console.log(`    → Taking first: ${clientIp}`);
        
        const isPrivate = isPrivateIP(clientIp);
        console.log(`    → Is private IP? ${isPrivate}`);
        
        if (clientIp && !isPrivate) {
          console.log(`✅ SELECTED IP: ${clientIp} (from ${header})`);
          console.log("==========================================");
          return clientIp;
        }
      } else {
        const ip = value.trim();
        const isPrivate = isPrivateIP(ip);
        console.log(`    → Is private IP? ${isPrivate}`);
        
        if (ip && !isPrivate) {
          console.log(`✅ SELECTED IP: ${ip} (from ${header})`);
          console.log("==========================================");
          return ip;
        }
      }
    }
  }
  
  console.warn('❌ Could not determine client IP - using "unknown"');
  console.log("==========================================");
  return "unknown";
}

export async function loginAction(email: string, password: string, loginAsRole: string) {
  const cookieStore = await cookies();
  const clientIp = await getClientIp();
  
  console.log("🌍 FINAL CLIENT IP FOR LOGGING:", clientIp);

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

  // Store email in cookie for logout logging
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
  
  console.log("🌍 FINAL CLIENT IP FOR LOGOUT:", clientIp);
  
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