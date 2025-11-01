// app/utils/activityLogger.ts

const EDGE_LOG_ACTIVITY_URL = process.env.NEXT_PUBLIC_EDGE_LOG_ACTIVITY_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function logToEdge(payload: Record<string, any>, clientIp?: string) {
  if (!EDGE_LOG_ACTIVITY_URL) {
    console.error("[ActivityLogger] NEXT_PUBLIC_EDGE_LOG_ACTIVITY_URL is not defined");
    return;
  }

  try {
    console.log("[ActivityLogger] Logging activity:", payload.action);
    console.log("[ActivityLogger] Client IP to send:", clientIp);
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add Supabase auth headers for compatibility
    if (SUPABASE_ANON_KEY) {
      headers["Authorization"] = `Bearer ${SUPABASE_ANON_KEY}`;
      headers["apikey"] = SUPABASE_ANON_KEY;
    }

    // IMPORTANT: Pass the IP in the payload, not just headers
    // Headers can be overwritten by proxies, but payload stays intact
    const payloadWithIp = {
      ...payload,
      clientIp: clientIp || "unknown", // Add IP to payload
    };

    const response = await fetch(EDGE_LOG_ACTIVITY_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payloadWithIp),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ActivityLogger] Edge function error:", response.status, errorText);
    } else {
      console.log("[ActivityLogger] Successfully logged:", payload.action);
    }
  } catch (err) {
    console.error("[ActivityLogger] Failed to log activity:", err);
  }
}

export async function logSuccessfulLogin(
  userId: string, 
  role: string, 
  email: string, 
  clientIp?: string
) {
  const username = email.split('@')[0]; // Extract username from email
  await logToEdge({ 
    userId, 
    role, 
    action: "login_success", 
    details: { 
      message: `User ${username} logged in successfully`,
      email,
      role
    } 
  }, clientIp);
}

export async function logFailedLogin(
  email: string, 
  attemptedRole: string, 
  userId?: string, 
  clientIp?: string
) {
  const username = email.split('@')[0]; // Extract username from email
  await logToEdge({ 
    userId: userId || null, 
    role: "unknown", 
    action: "login_failed", 
    details: { 
      message: `User ${username} failed to login`,
      email, 
      attempted_role: attemptedRole 
    } 
  }, clientIp);
}

export async function logUnauthorizedAccess(
  userId: string, 
  actualRole: string, 
  email: string, 
  attemptedRole: string,
  clientIp?: string
) {
  const username = email.split('@')[0]; // Extract username from email
  
  // Map role codes to readable names
  const roleNameMap: Record<string, string> = {
    R01: "clinician",
    R02: "clerk",
    R03: "clinical instructor",
    R04: "chief of clinicians",
  };
  
  const attemptedRoleName = roleNameMap[attemptedRole] || attemptedRole;
  
  await logToEdge({
    userId,
    role: actualRole,
    action: "unauthorized_access",
    details: { 
      message: `User ${username} attempted unauthorized access as ${attemptedRoleName}`,
      email, 
      actual_role: actualRole, 
      attempted_role: attemptedRole,
      attempted_role_name: attemptedRoleName
    },
  }, clientIp);
}

export async function logLogout(userId: string, role: string, email?: string, clientIp?: string) {
  let message = "User logged out";
  
  if (email) {
    const username = email.split('@')[0];
    message = `User ${username} logged out`;
  }
  
  await logToEdge({ 
    userId, 
    role, 
    action: "logout", 
    details: { 
      message,
      email: email || undefined
    } 
  }, clientIp);
}