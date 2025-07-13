// components/sidebar/sidebar-config.ts
export type UserRole = "clinician" | "chief-of-clinicians" | "clerk" | "clinical-instructor"

type MenuItem = {
  label: string
  href: string
  icon?: React.ReactNode // optional: for lucide icons
}

export const sidebarMenuConfig: Record<UserRole, MenuItem[]> = {
  clinician: [
    { label: "Dashboard", href: "/dashboard/clinician" },
    { label: "Activities", href: "/activities/clinician" },
    { label: "Dental Chairs", href: "/dental-chairs/clinician" },
    { label: "Records", href: "/records/clinician" },
    { label: "Form", href: "/form/clinician" },
  ],
  "chief-of-clinicians": [
    { label: "Dashboard", href: "/dashboard/chief-of-clinicians" },
    { label: "Clinicians", href: "/clinicians/chief-of-clinicians" },
    { label: "Reports", href: "/reports/chief-of-clinicians" },
    { label: "Incident Logs", href: "/incident-logs/chief-of-clinicians" },
    { label: "Activity Logs", href: "/activity-logs/chief-of-clinicians" },
  ],
  clerk: [
    { label: "Dashboard", href: "/dashboard/clerk" },
    { label: "Reports", href: "/reports/clerk" },
  ],
  "clinical-instructor": [
    { label: "Dashboard", href: "/dashboard/clinical-instructor" },
    { label: "Attendance", href: "/attendance/clinical-instructor" },
    { label: "Clinicians", href: "/clinicians/clinical-instructor" },
    { label: "Activities", href: "/activities/clinical-instructor" },
  ],
}
