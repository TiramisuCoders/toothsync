import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Environment variables missing for Supabase Admin client:", {
    SUPABASE_URL_SET: !!supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY_SET: !!supabaseServiceRoleKey,
  })
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables for server-side operations.")
}

// Create a Supabase client for server-side operations (e.g., API routes, Server Actions)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
