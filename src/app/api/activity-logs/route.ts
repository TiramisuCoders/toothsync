import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

// GET /api/activity-logs - Fetch all logs
export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ message: "Supabase configuration missing" }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from("activity_logs")
      .select("id, created_at, user_id, role, action, details")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching logs:", error)
      return NextResponse.json({ message: "Failed to fetch activity logs", error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    console.error("Unexpected error:", err)
    return NextResponse.json({ message: "Internal server error", error: err.message }, { status: 500 })
  }
}
