export type UserRole = "clinician" | "clerk" | "clinical-instructor" | "chief-of-clinicians"

export const ROLE_MAP: Record<string, UserRole> = {
  R01: "clinician",
  R02: "clerk",
  R03: "clinical-instructor",
  R04: "chief-of-clinicians",
}

export const ROLE_BASED_ROUTES = [
  "dashboard",
  "attendance",
  "clinicians",
  "clerks",
  "activities",
  "dental-chairs",
  "records",
  "form",
  "schedule",
  "instructor",
  "reports",
  "incident-logs",
  "activity-logs",
]

export const ROLE_ROUTES: Record<UserRole, string[]> = {
  clinician: ["/dashboard/clinician", "/dashboard/clinician/*"],
  clerk: ["/dashboard/clerk", "/dashboard/clerk/*"],
  "clinical-instructor": ["/dashboard/clinical-instructor", "/dashboard/clinical-instructor/*"],
  "chief-of-clinicians": ["/dashboard/chief-of-clinicians", "/dashboard/chief-of-clinicians/*"],
}

export function getDefaultDashboard(role: UserRole): string {
  const dashboardMap: Record<UserRole, string> = {
    clinician: "/dashboard/clinician",
    clerk: "/dashboard/clerk",
    "clinical-instructor": "/dashboard/clinical-instructor",
    "chief-of-clinicians": "/dashboard/chief-of-clinicians",
  }
  return dashboardMap[role] || "/dashboard/clinician"
}

export function canAccessPath(role: UserRole, path: string): boolean {
  const allowedRoutes = ROLE_ROUTES[role]
  if (!allowedRoutes) return false

  return allowedRoutes.some((route) => {
    if (route.endsWith("/*")) {
      const baseRoute = route.slice(0, -2)
      return path.startsWith(baseRoute)
    }
    return path === route
  })
}

export function getRoleFromCode(roleCode: string): UserRole {
  return ROLE_MAP[roleCode] || "clinician"
}

export function extractRoleFromPath(path: string): UserRole | null {
  const segments = path.split("/").filter(Boolean)
  if (segments.length < 2) return null

  const potentialRole = segments[1]

  // Map URL role names to UserRole type
  const roleMap: Record<string, UserRole> = {
    clinician: "clinician",
    clerk: "clerk",
    "clinical-instructor": "clinical-instructor",
    "chief-of-clinicians": "chief-of-clinicians",
  }

  return roleMap[potentialRole] || null
}

export function isRoleBasedRoute(path: string): boolean {
  const segments = path.split("/").filter(Boolean)
  if (segments.length < 1) return false

  const routeType = segments[0]
  return ROLE_BASED_ROUTES.includes(routeType)
}

export function redirectPathToRole(path: string, userRole: UserRole): string {
  const segments = path.split("/").filter(Boolean)
  if (segments.length < 2) return getDefaultDashboard(userRole)

  const routeType = segments[0]
  const restOfPath = segments.slice(2).join("/")

  return `/${routeType}/${userRole}${restOfPath ? "/" + restOfPath : ""}`
}
