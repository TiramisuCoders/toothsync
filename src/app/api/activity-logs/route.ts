// app/api/activity-logs/route.ts

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const severityFilter = searchParams.get('severity') // 'INFO', 'WARN', 'ERROR', or null for all

    let query = supabase
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
        severity,
        category,
        users:users(first_name, last_name, email)
        `
      )
      .order("created_at", { ascending: false })

    // Apply severity filter if provided
    if (severityFilter && severityFilter !== 'All') {
      query = query.eq('severity', severityFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error("[ActivityLogs] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map to frontend format
    const mappedData = data.map((log: any) => ({
      id: log.id,
      created_at: log.created_at,
      user_id: log.user_id,
      action: log.action,           // Display the formatted action message
      action_key: log.action_key,   // Include action_key for reference
      details: log.details || '{}', // Raw JSON details
      role: log.role || "unknown",
      severity: log.severity || "INFO",
      category: log.category || "USER_ACTION",
      user_display: log.users 
        ? `${log.users.first_name} ${log.users.last_name}` 
        : "Unknown User",
      user_email: log.users?.email || "N/A",
      ip_address: log.ip_address || "N/A",
      city: log.city || "Unknown",
      country: log.country || "Unknown",
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