"use server"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"

export async function loginAction(email: string, password: string) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    },
  )

  await supabase.auth.signOut()
  await supabase.auth.refreshSession()

  // Authenticate the user
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  const user = data.user

  if (error) {
    console.log("[v0] Login error:", error)
    return { error: { message: "Invalid email or password. Please check your credentials and try again." } }
  }

  console.log("[v0] Login successful for email:", email)
  console.log("[v0] Authenticated user ID:", user?.id)

  // Get user role from database
  const { data: userRecord, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("auth_user_id", user?.id)
    .single()

  if (roleError || !userRecord) {
    console.log("[v0] Role fetch error:", roleError)
    return { error: { message: "User role not found" } }
  }

  console.log("[v0] User role from database:", userRecord.role)

  const roleMap: Record<string, string> = {
    R01: "clinician",
    R02: "clerk",
    R03: "clinical-instructor",
    R04: "chief-of-clinicians",
  }

  const roleName = roleMap[userRecord.role]
  console.log("[v0] Mapped role name:", roleName)

  if (!roleName) {
    console.log("[v0] Invalid role mapping for:", userRecord.role)
    return { error: { message: "Invalid user role" } }
  }

  // IMPORTANT: Delete the old cookie first to prevent conflicts
  cookieStore.delete("role")

  // Set the new role cookie (httpOnly: false allows client-side reading)
  cookieStore.set("role", roleName, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/", // Ensure cookie is available across all routes
  })

  console.log("[v0] Role cookie set to:", roleName)

  // Redirect based on role
  const redirectMap: Record<string, string> = {
    R01: "/dashboard/clinician",
    R02: "/dashboard/clerk",
    R03: "/dashboard/clinical-instructor",
    R04: "/dashboard/chief-of-clinicians",
  }

  const redirectPath = redirectMap[userRecord.role]

  if (redirectPath) {
    redirect(redirectPath)
  }

  return { success: true, role: roleName }
}

export async function logoutAction() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    },
  )

  await supabase.auth.signOut()

  // Clear role cookie
  cookieStore.delete("role")

  console.log("[v0] User logged out and role cleared")

  return { success: true }
}