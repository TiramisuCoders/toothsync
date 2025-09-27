"use server"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

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
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  )

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.log("[v0] Login error:", error)
    return { error }
  }

  console.log("[v0] Login successful for email:", email)

  const { data: userRecord, error: roleError } = await supabase.from("users").select("role").eq("email", email).single()

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

  cookieStore.delete("role")

  cookieStore.set("role", roleName, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  console.log("[v0] Role cookie set to:", roleName)

  return { success: true }
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

export async function signOutAction() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
        remove: (name, options) => cookieStore.delete({name, ...options }),
      },
    }
  )

  const { error } = await supabase.auth.signOut()

  return { error }
}
