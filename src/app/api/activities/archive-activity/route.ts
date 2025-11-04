// app/api/activities/update-status/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient()
  try {
    const body = await req.json()
    const { activityId, status } = body

    if (!activityId || !status) {
      return NextResponse.json(
        { error: "Missing activityId or status" },
        { status: 400 }
      )
    }
    // Update the activity status in DB
    const { data, error } = await supabase
      .from("activities")
      .update({ status })
      .eq("record_id", activityId)
      .select()

    if (error) {
      console.error("❌ Error updating status:", error.message)
      return NextResponse.json(
        { error: "Database update failed", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("❌ API crashed:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
