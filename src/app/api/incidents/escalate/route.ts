// app/api/incidents/escalate/route.ts

import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const start = performance.now()
  
  // ✅ Use the SAME auth pattern as dashboard route
  const supabase = await createSupabaseServerClient()

  try {
    // 🔒 Auth check - EXACT same pattern as dashboard
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 🧑 Get user role - EXACT same pattern as dashboard
    const { data: userRole, error: roleError } = await supabase
      .from("users")
      .select("first_name, last_name, auth_user_id, role")
      .eq("auth_user_id", user.id)
      .single()

    if (roleError || !userRole) {
      console.error('❌ Role error:', roleError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log('👤 Authenticated user:', {
      id: user.id,
      role: userRole.role,
      name: `${userRole.first_name} ${userRole.last_name}`
    })

    // ✅ Now proceed with escalation logic
    const body = await request.json()
    const { incident_id, escalated_by_user_id } = body 

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    if (!incident_id) {
      return NextResponse.json({ error: "Incident ID is required" }, { status: 400 })
    }

    console.log('🚀 Escalating incident to Support Team:', incident_id)

    // 2. FETCH COMPLETE INCIDENT DETAILS
    const { data: incident, error: fetchError } = await supabaseAdmin
      .from('incident')
      .select(`
        incident_id,
        ticket_num,
        title,
        reporter_email,
        module_id,
        issue_type_id,
        severity_id,
        priority,
        description,
        submitted_at,
        escalated_to_support,
        status,
        affected_module(module_name),
        issue_type(issue_type_name),
        severity_level(severity_name)
      `)
      .eq('incident_id', incident_id)
      .single()

    if (fetchError || !incident) {
      console.error('❌ Fetch error:', fetchError)
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    if (incident.escalated_to_support || incident.status === 'Resolved' || incident.status === 'Cancelled') {
      return NextResponse.json({ error: 'Incident cannot be escalated' }, { status: 400 })
    }

    // 3. UPDATE INCIDENT IN DATABASE
    const { error: updateError } = await supabaseAdmin
      .from('incident')
      .update({
        escalated_to_support: true,
        escalated_at: new Date().toISOString(),
        escalated_by_user_id: escalated_by_user_id || user.id, 
        updated_at: new Date().toISOString()
      })
      .eq('incident_id', incident_id)

    if (updateError) {
      console.error('❌ Error updating incident:', updateError)
      return NextResponse.json({ error: 'Failed to update database' }, { status: 500 })
    }

    console.log('✅ Incident updated successfully')

    // 4. ADD SYSTEM NOTE
    const { error: noteError } = await supabaseAdmin
      .from('incident_note')
      .insert({
        incident_id,
        author_user_id: 'system',
        body: `Incident escalated to Support Team by admin (${user.email || user.id})`,
        note_type: 'system',
        created_at: new Date().toISOString()
      })

    if (noteError) {
      console.error('⚠️ Error creating escalation note:', noteError)
    } else {
      console.log('✅ System note created')
    }

    // 5. PREPARE AND SEND WEBHOOK (NON-BLOCKING)
    const webhookUrl = process.env.ACTIVEPIECES_ESCALATION_WEBHOOK_URL
    
    if (webhookUrl) {
      // Extract nested data safely
      const moduleName = incident.affected_module?.module_name || 'Unknown Module'
      const issueTypeName = incident.issue_type?.issue_type_name || 'Unknown Issue Type'
      const severityName = incident.severity_level?.severity_name || 'Unknown Severity'

      const webhookPayload = {
        ticket_num: incident.ticket_num,
        title: incident.title,
        reporter_email: incident.reporter_email,
        module_name: moduleName,
        issue_type_name: issueTypeName,
        severity_name: severityName,
        priority: incident.priority,
        description: incident.description,
        submitted_at: new Date(incident.submitted_at).toLocaleString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
        }),
        escalated_at: new Date().toLocaleString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
        }),
        support_email: 'judeemmanuel.flores.cics@ust.edu.ph' 
      }
      
      // FIRE-AND-FORGET: Non-blocking webhook
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      })
      .then(response => {
        if (!response.ok) {
          console.error('⚠️ Webhook failed (async):', response.status)
        } else {
          console.log('✅ Webhook sent successfully (async)')
        }
      })
      .catch(error => console.error('⚠️ Webhook error (async):', error))
      
      console.log('📧 Webhook dispatched (non-blocking)')
    } else {
      console.warn('⚠️ ACTIVEPIECES_ESCALATION_WEBHOOK_URL not configured')
    }

    // 6. RETURN SUCCESS IMMEDIATELY
    const end = performance.now()
    console.log(`⏱️ API execution time: ${(end - start).toFixed(2)} ms`)
    console.log('✅ Incident escalation complete, responding to client')

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