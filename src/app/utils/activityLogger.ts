// app/utils/activityLogger.ts
// Refactored to use audit_bank templates

const EDGE_LOG_ACTIVITY_URL = process.env.NEXT_PUBLIC_EDGE_LOG_ACTIVITY_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface LogActivityParams {
  actionKey: string;
  userId: string | null;
  roleId: string;
  placeholders?: Record<string, string | number>;
  metadata?: Record<string, any>;
  clientIp?: string;
}

/**
 * Main function to log activities using audit_bank templates
 */
async function logActivity({
  actionKey,
  userId,
  roleId,
  placeholders = {},
  metadata = {},
  clientIp,
}: LogActivityParams) {
  if (!EDGE_LOG_ACTIVITY_URL) {
    console.error("[ActivityLogger] NEXT_PUBLIC_EDGE_LOG_ACTIVITY_URL is not defined");
    return;
  }

  try {
    console.log(`[ActivityLogger] Logging activity: ${actionKey}`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (SUPABASE_ANON_KEY) {
      headers["Authorization"] = `Bearer ${SUPABASE_ANON_KEY}`;
      headers["apikey"] = SUPABASE_ANON_KEY;
    }

    if (clientIp) {
      headers["X-Forwarded-For"] = clientIp;
      headers["X-Real-IP"] = clientIp;
    }

    const payload = {
      action_key: actionKey,
      user_id: userId,
      role_id: roleId,
      placeholders,
      metadata,
    };

    const response = await fetch(EDGE_LOG_ACTIVITY_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ActivityLogger] Edge function error:`, response.status, errorText);
    } else {
      console.log(`[ActivityLogger] Successfully logged: ${actionKey}`);
    }
  } catch (err) {
    console.error(`[ActivityLogger] Failed to log activity:`, err);
  }
}

// =====================================================
// AUTHENTICATION ACTIONS
// =====================================================

export async function logSuccessfulLogin(
  userId: string,
  roleId: string,
  email: string,
  clientIp?: string
) {
  const username = email.split("@")[0];

  await logActivity({
    actionKey: "login_success",
    userId,
    roleId,
    placeholders: { username },
    metadata: { email, client_ip: clientIp },
    clientIp,
  });
}
export async function logAcademicYearCreated(
  userId: string,
  roleId: string,
  email: string,
  year: string,
  clientIp?: string
) {
  const username = email.split("@")[0];

  await logActivity({
    actionKey: "academic_year_created",
    userId,
    roleId,
    placeholders: { username, year },
    metadata: { email, academic_year: year, client_ip: clientIp },
    clientIp,
  });
}

export async function logAcademicYearStatusChanged(
  userId: string,
  roleId: string,
  email: string,
  year: string,
  oldStatus: string,
  newStatus: string,
  clientIp?: string
) {
  const username = email.split("@")[0];

  await logActivity({
    actionKey: "academic_year_status_changed",
    userId,
    roleId,
    placeholders: { username, year, old_status: oldStatus, new_status: newStatus },
    metadata: { email, academic_year: year, old_status: oldStatus, new_status: newStatus, client_ip: clientIp },
    clientIp,
  });
}
export async function logAcademicYearEdited(
  userId: string,
  roleId: string,
  email: string,
  oldYear: string,
  newYear: string,
  clientIp?: string
) {
  const username = email.split("@")[0]; // ✅ Fixed: Regular quotes

  await logActivity({
    actionKey: "academic_year_edited",
    userId,
    roleId,
    placeholders: {
      username,
      old_year: oldYear,
      new_year: newYear,
    },
    metadata: {
      email,
      old_academic_year: oldYear,
      new_academic_year: newYear,
      client_ip: clientIp,
    },
    clientIp,
  });
}

export async function logFailedLogin(
  email: string,
  attemptedRoleId: string,
  userId?: string,
  clientIp?: string
) {
  const username = email.split("@")[0];

  await logActivity({
    actionKey: "login_failed",
    userId: userId || null,
    roleId: "unknown",
    placeholders: { username },
    metadata: {
      email,
      attempted_role_id: attemptedRoleId,
      client_ip: clientIp,
    },
    clientIp,
  });
}

export async function logUnauthorizedAccess(
  userId: string,
  actualRoleId: string,
  email: string,
  attemptedRoleId: string,
  clientIp?: string
) {
  const username = email.split("@")[0];

  // Map role IDs to names for the message
  const roleNameMap: Record<string, string> = {
    R01: "clinician",
    R02: "clerk",
    R03: "clinical instructor",
    R04: "chief of clinicians",
  };

  const attemptedRoleName = roleNameMap[attemptedRoleId] || attemptedRoleId;

  await logActivity({
    actionKey: "unauthorized_access",
    userId,
    roleId: actualRoleId,
    placeholders: {
      username,
      role_name: attemptedRoleName,
    },
    metadata: {
      email,
      actual_role_id: actualRoleId,
      attempted_role_id: attemptedRoleId,
      client_ip: clientIp,
    },
    clientIp,
  });
}

export async function logLogout(
  userId: string,
  roleId: string,
  email?: string,
  clientIp?: string
) {
  const username = email ? email.split("@")[0] : "unknown";

  await logActivity({
    actionKey: "logout",
    userId,
    roleId,
    placeholders: { username },
    metadata: {
      email: email || undefined,
      client_ip: clientIp,
    },
    clientIp,
  });
}

// =====================================================
// ACCESS MANAGEMENT ACTIONS
// =====================================================

export async function logAccessRequestSubmitted(
  userId: string,
  roleId: string,
  email: string,
  requestedRole: string
) {
  const username = email.split("@")[0];

  await logActivity({
    actionKey: "access_request_submitted",
    userId,
    roleId,
    placeholders: {
      username,
      role_name: requestedRole,
    },
    metadata: { email, requested_role: requestedRole },
  });
}

export async function logAccessRequestApproved(
  adminUserId: string,
  adminRoleId: string,
  adminEmail: string,
  approvedUserId: string,
  approvedEmail: string,
  approvedRole: string
) {
  const adminUsername = adminEmail.split("@")[0];
  const username = approvedEmail.split("@")[0];

  await logActivity({
    actionKey: "access_request_approved",
    userId: adminUserId,
    roleId: adminRoleId,
    placeholders: {
      admin_username: adminUsername,
      username,
      role_name: approvedRole,
    },
    metadata: {
      admin_email: adminEmail,
      approved_user_id: approvedUserId,
      approved_email: approvedEmail,
      approved_role: approvedRole,
    },
  });
}

// =====================================================
// SERVICE REQUEST ACTIONS
// =====================================================

export async function logRequestCreated(
  userId: string,
  roleId: string,
  email: string,
  requestId: string,
  resources: string
) {
  const username = email.split("@")[0];

  await logActivity({
    actionKey: "request_created",
    userId,
    roleId,
    placeholders: {
      username,
      resources,
    },
    metadata: {
      email,
      request_id: requestId,
    },
  });
}

export async function logRequestApproved(
  clerkUserId: string,
  clerkRoleId: string,
  clerkEmail: string,
  clinicianEmail: string,
  requestId: string
) {
  const clerkUsername = clerkEmail.split("@")[0];
  const clinicianUsername = clinicianEmail.split("@")[0];

  await logActivity({
    actionKey: "request_approved",
    userId: clerkUserId,
    roleId: clerkRoleId,
    placeholders: {
      clerk_username: clerkUsername,
      clinician_username: clinicianUsername,
      request_id: requestId,
    },
    metadata: {
      clerk_email: clerkEmail,
      clinician_email: clinicianEmail,
      request_id: requestId,
    },
  });
}

// =====================================================
// SYSTEM ACTIONS (No User)
// =====================================================

export async function logSystemAllocatedResources(
  activityId: string,
  chair: string,
  instructor: string
) {
  await logActivity({
    actionKey: "system_allocated_resources",
    userId: null,
    roleId: "system",
    placeholders: {
      activity_id: activityId,
      chair,
      instructor,
    },
    metadata: {
      activity_id: activityId,
      chair_id: chair,
      instructor_id: instructor,
    },
  });
}

export async function logSystemCreatedActivity(activityId: string, requestId: string) {
  await logActivity({
    actionKey: "system_created_activity",
    userId: null,
    roleId: "system",
    placeholders: {
      activity_id: activityId,
      request_id: requestId,
    },
    metadata: {
      activity_id: activityId,
      request_id: requestId,
    },
  });
}

// =====================================================
// BULK OPERATIONS
// =====================================================

export async function logBulkDelete(
  userId: string,
  roleId: string,
  email: string,
  module: string,
  recordCount: number
) {
  const username = email.split("@")[0];

  await logActivity({
    actionKey: "bulk_delete",
    userId,
    roleId,
    placeholders: {
      username,
      module,
      record_count: recordCount.toString(),
    },
    metadata: {
      email,
      module,
      record_count: recordCount,
    },
  });
}

// app/utils/activityLogger.ts
// Add these functions to your existing file

// =====================================================
// CLERK MANAGEMENT ACTIONS
// =====================================================

export async function logClerkPromoted(
  adminUserId: string,
  adminRoleId: string,
  adminEmail: string,
  promotedUserId: string,
  promotedEmail: string,
  academicYear: string,
  clientIp?: string
) {
  const adminUsername = adminEmail.split("@")[0];
  const promotedUsername = promotedEmail.split("@")[0];

  await logActivity({
    actionKey: "clerk_promoted",
    userId: adminUserId,
    roleId: adminRoleId,
    placeholders: {
      admin_username: adminUsername,
      username: promotedUsername,
      academic_year: academicYear,
    },
    metadata: {
      admin_email: adminEmail,
      promoted_user_id: promotedUserId,
      promoted_email: promotedEmail,
      academic_year: academicYear,
    },
    clientIp,
  });
}

export async function logClerkStatusChanged(
  adminUserId: string,
  adminRoleId: string,
  adminEmail: string,
  clerkUserId: string,
  clerkEmail: string,
  oldStatus: string,
  newStatus: string,
  clientIp?: string
) {
  const adminUsername = adminEmail.split("@")[0];
  const clerkUsername = clerkEmail.split("@")[0];

  await logActivity({
    actionKey: "clerk_status_changed",
    userId: adminUserId,
    roleId: adminRoleId,
    placeholders: {
      admin_username: adminUsername,
      clerk_username: clerkUsername,
      old_status: oldStatus,
      new_status: newStatus,
    },
    metadata: {
      admin_email: adminEmail,
      clerk_user_id: clerkUserId,
      clerk_email: clerkEmail,
      old_status: oldStatus,
      new_status: newStatus,
    },
    clientIp,
  });
}

export async function logClerkArchived(
  adminUserId: string,
  adminRoleId: string,
  adminEmail: string,
  clerkUserId: string,
  clerkEmail: string,
  clientIp?: string
) {
  const adminUsername = adminEmail.split("@")[0];
  const clerkUsername = clerkEmail.split("@")[0];

  await logActivity({
    actionKey: "clerk_archived",
    userId: adminUserId,
    roleId: adminRoleId,
    placeholders: {
      admin_username: adminUsername,
      clerk_username: clerkUsername,
    },
    metadata: {
      admin_email: adminEmail,
      clerk_user_id: clerkUserId,
      clerk_email: clerkEmail,
    },
    clientIp,
  });
}

export async function logClerkUnarchived(
  adminUserId: string,
  adminRoleId: string,
  adminEmail: string,
  clerkUserId: string,
  clerkEmail: string,
  clientIp?: string
) {
  const adminUsername = adminEmail.split("@")[0];
  const clerkUsername = clerkEmail.split("@")[0];

  await logActivity({
    actionKey: "clerk_unarchived",
    userId: adminUserId,
    roleId: adminRoleId,
    placeholders: {
      admin_username: adminUsername,
      clerk_username: clerkUsername,
    },
    metadata: {
      admin_email: adminEmail,
      clerk_user_id: clerkUserId,
      clerk_email: clerkEmail,
    },
    clientIp,
  });
}

export async function logBulkExport(
  userId: string,
  roleId: string,
  email: string,
  module: string,
  recordCount: number
) {
  const username = email.split("@")[0];

  await logActivity({
    actionKey: "bulk_export",
    userId,
    roleId,
    placeholders: {
      username,
      module,
      record_count: recordCount.toString(),
    },
    metadata: {
      email,
      module,
      record_count: recordCount,
    },
  });
}

// Add more helper functions as needed following the same pattern...