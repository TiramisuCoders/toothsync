import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Create this new function for API routes
export async function createAuthenticatedSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
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
        remove: (name, options) => cookieStore.set(name, "", { ...options, maxAge: 0 }),
      },
    }
  )
}