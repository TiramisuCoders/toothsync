// app/api/incidents/escalate/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { incident_id, escalated_by_user_id } = body

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    if (!incident_id) {
      return NextResponse.json({ error: "Incident ID is required" }, { status: 400 })
    }

    console.log('🚀 Escalating incident to Support Team:', incident_id)

    // Check if incident exists and is not already escalated
    const { data: incident, error: fetchError } = await supabaseAdmin
      .from('incident')
      .select('incident_id, ticket_num, escalated_to_support, status')
      .eq('incident_id', incident_id)
      .single()

    if (fetchError || !incident) {
      console.error('❌ Error fetching incident:', fetchError)
      return NextResponse.json({ 
        error: 'Incident not found', 
        details: fetchError?.message 
      }, { status: 404 })
    }

    if (incident.escalated_to_support) {
      return NextResponse.json({ 
        error: 'Incident already escalated to Support Team' 
      }, { status: 400 })
    }

    if (incident.status === 'Resolved' || incident.status === 'Cancelled') {
      return NextResponse.json({ 
        error: 'Cannot escalate finalized incidents' 
      }, { status: 400 })
    }

    // Update incident to mark as escalated
    const { error: updateError } = await supabaseAdmin
      .from('incident')
      .update({
        escalated_to_support: true,
        escalated_at: new Date().toISOString(),
        escalated_by_user_id: escalated_by_user_id || 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('incident_id', incident_id)

    if (updateError) {
      console.error('❌ Error updating incident:', updateError)
      return NextResponse.json({ 
        error: 'Failed to escalate incident', 
        details: updateError.message 
      }, { status: 500 })
    }

    // Add a system note about the escalation
    const { error: noteError } = await supabaseAdmin
      .from('incident_note')
      .insert({
        incident_id,
        author_user_id: 'system',
        body: `Incident escalated to Support Team by admin`,
        note_type: 'system',
        created_at: new Date().toISOString()
      })

    if (noteError) {
      console.error('❌ Error creating escalation note:', noteError)
      // Don't fail the request if note creation fails
    }

    console.log('✅ Incident escalated successfully')

    return NextResponse.json({ 
      success: true, 
      message: 'Incident escalated to Support Team successfully'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('💥 Unexpected error in escalate POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}