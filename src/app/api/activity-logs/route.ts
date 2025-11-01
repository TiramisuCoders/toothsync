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
        action,
        details,
        user_id,
        role,
        users:users(first_name, last_name)
        `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const mappedData = data.map((log: any) => ({
      id: log.id,
      created_at: log.created_at,
      user_id: log.user_id,
      action: log.action,
      details: log.details,
      role: log.role || "unknown",
      user_display: log.users ? `${log.users.first_name} ${log.users.last_name}` : "Unknown User",
    }))

    return NextResponse.json(mappedData)
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 })
  }
}
