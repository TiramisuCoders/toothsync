"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function signOut() {
  const cookieStore = await cookies()

  // Clear all authentication-related cookies
  cookieStore.delete("role")
  cookieStore.delete("sb-auth-token")

  // Clear any Supabase session cookies
  const allCookies = cookieStore.getAll()
  allCookies.forEach((cookie) => {
    if (cookie.name.startsWith("sb-") || cookie.name.includes("session")) {
      cookieStore.delete(cookie.name)
    }
  })

  redirect("/app/landing")
}
