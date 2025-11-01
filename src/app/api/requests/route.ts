import type { NextRequest } from "next/server"
import { createAuthenticatedSupabaseClient } from "@/lib/supabase-route"
import { logRequestApproved } from "@/app/utils/activityLogger"

export async function GET() {
  const supabase = await createAuthenticatedSupabaseClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userRole } = await supabase.from("users").select("role").eq("auth_user_id", user.id).single()

    const allowedRoles = ["R02", "R04"]

    if (!allowedRoles.includes(userRole?.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch attendance records
    const { data: attendance, error: err } = await supabase
      .from("request")
      .select(
        `
        request_id,
        created_at,
        is_sanitized,
        status,
        clinician:clinician_id(
          first_name,
          last_name
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (err) {
      return Response.json({ error: "Database error", details: err.message }, { status: 500 })
    }

    // Transform data to match your interface
    const transformedData =
      attendance?.map((record) => ({
        id: record.request_id,
        firstName: record.clinician?.first_name || "",
        lastName: record.clinician?.last_name || "",
        date: new Date(record.created_at).toISOString().split("T")[0],
        sanitize: record.is_sanitized ? "Yes" : "No",
        status: record.status || "Pending",
      })) || []

    return Response.json({
      success: true,
      data: transformedData,
      user_id: user.id,
    })
  } catch (error) {
    console.error("Error in GET /api/requests:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createAuthenticatedSupabaseClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userRole } = await supabase.from("users").select("role").eq("auth_user_id", user.id).single()

    const allowedRoles = ["R02", "R04"]

    if (!allowedRoles.includes(userRole?.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { request_id, record_id } = body

    if (!request_id && !record_id) {
      return Response.json({ error: "Missing request_id or record_id" }, { status: 400 })
    }

    const idToProcess = record_id || request_id

    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/resource-match`
    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        id: idToProcess,
        clerkId: user.id,
      }),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        supabaseError: result.error || null,
        payload: result,
      }

      console.error("Edge function error:", errorDetails)

      return Response.json(
        {
          error: "Resource matching failed",
          details: errorDetails,
          success: false,
        },
        { status: response.status || 400 },
      )
    }

    const { data: userEmail } = await supabase.from("users").select("email").eq("auth_user_id", user.id).single()

    const { data: requestData } = await supabase
      .from("request")
      .select("clinician_id")
      .eq("request_id", idToProcess)
      .single()

    const { data: clinicianEmail } = await supabase
      .from("users")
      .select("email")
      .eq("auth_user_id", requestData?.clinician_id)
      .single()

    await logRequestApproved(
      user.id,
      userRole?.role,
      userEmail?.email || "unknown@example.com",
      clinicianEmail?.email || "unknown@example.com",
      idToProcess,
    )

    return Response.json(
      {
        success: true,
        result: result,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in POST /api/requests:", error)
    return Response.json(
      {
        error: error.message || "Failed to process confirmation",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
