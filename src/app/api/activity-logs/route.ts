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
      .select(`
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
        category
      `)
      .order("created_at", { ascending: false })

    // Apply severity filter if provided
    if (severityFilter && severityFilter !== 'All') {
      query = query.eq('severity', severityFilter)
    }

    const { data: logs, error: logsError } = await query

    if (logsError) {
      console.error("[ActivityLogs] Supabase error:", logsError)
      return NextResponse.json({ error: logsError.message }, { status: 500 })
    }

    // Get unique user IDs that are not null
    const userIds = [...new Set(logs
      .map(log => log.user_id)
      .filter(id => id !== null)
    )]

    // Fetch user data separately if there are any user IDs
    let usersMap = new Map()
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('auth_user_id, first_name, last_name, email')
        .in('auth_user_id', userIds)

      if (!usersError && users) {
        users.forEach(user => {
          usersMap.set(user.auth_user_id, user)
        })
      }
    }

    // Map to frontend format with manual join
    const mappedData = logs.map((log: any) => {
      const user = log.user_id ? usersMap.get(log.user_id) : null

      return {
        id: log.id,
        created_at: log.created_at,
        user_id: log.user_id,
        action: log.action,
        action_key: log.action_key,
        details: log.details || '{}',
        role: log.role || "unknown",
        severity: log.severity || "INFO",
        category: log.category || "USER_ACTION",
        user_display: user 
          ? `${user.first_name} ${user.last_name}` 
          : log.user_id ? "Deleted User" : "System",
        user_email: user?.email || (log.user_id ? "N/A" : "system"),
        ip_address: log.ip_address || "N/A",
        city: log.city || "Unknown",
        country: log.country || "Unknown",
      }
    })

    return NextResponse.json(mappedData)
  } catch (error) {
    console.error("[ActivityLogs] API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch activity logs" }, 
      { status: 500 }
    )
  }
}