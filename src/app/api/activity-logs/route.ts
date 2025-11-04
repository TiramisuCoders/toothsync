// app/api/activity-logs/route.ts
// Fixed to return correct column mapping with location data

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from("activity_logs")
      .select(
        `
        id,
        created_at,
        action_key,
        action,
        details,
        user_id,
        role,
        ip_address,
        city,
        country,
        users:users(first_name, last_name)
        `
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[ActivityLogs] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map to frontend format:
    // FE "Action" = BE "action_key" 
    // FE "Details" = BE "action" (the formatted template message)
    const mappedData = data.map((log: any) => ({
      id: log.id,
      created_at: log.created_at,
      user_id: log.user_id,
      action: log.action_key,  // ✅ FE displays action_key as "Action"
      details: log.action,      // ✅ FE displays formatted message as "Details"
      role: log.role || "unknown",
      user_display: log.users 
        ? `${log.users.first_name} ${log.users.last_name}` 
        : "Unknown User",
      ip_address: log.ip_address,
      city: log.city,
      country: log.country,
      metadata: log.details || null, // Extra JSON data if needed
    }))

    return NextResponse.json(mappedData)
  } catch (error) {
    console.error("[ActivityLogs] API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch activity logs" }, 
      { status: 500 }
    )
  }
}