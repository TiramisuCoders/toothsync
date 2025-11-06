// app/api/incidents/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const start = performance.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const incidentId = searchParams.get('incident_id')

 // ✅ AUTH CHECK - Match middleware pattern
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        // No need to set cookies in GET requests, but keeping for consistency
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

    // Get user role
    const { data: userRole, error: roleError } = await supabase
      .from('users')
      .select('role, auth_user_id, first_name, last_name')
      .eq('auth_user_id', user.id)
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

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    // Fetch assignable users (R04 chiefs)
    if (type === 'assignable_users') {
      console.log('🔥 Fetching assignable users (R04)...')
      
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('auth_user_id, first_name, last_name, email')
        .eq('role', 'R04')

      if (error) {
        console.error('❌ Error fetching assignable users:', error)
        return NextResponse.json({ error: 'Failed to fetch users', details: error.message }, { status: 500 })
      }

      const formattedUsers = users?.map(user => ({
        user_id: user.auth_user_id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email
      })) || []

      console.log('✅ Assignable users fetched:', formattedUsers.length)
      return NextResponse.json({ success: true, users: formattedUsers })
    }

    // Fetch incident notes
    if (type === 'notes' && incidentId) {
      console.log('🔥 Fetching notes for incident:', incidentId)
      
      const { data: notes, error } = await supabaseAdmin
        .from('incident_note')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching notes:', error)
        return NextResponse.json({ error: 'Failed to fetch notes', details: error.message }, { status: 500 })
      }

      // Get unique author user IDs
      const authorUserIds = [...new Set((notes || [])
        .map(note => note.author_user_id)
        .filter(id => id && id !== 'system')
      )]

      // Fetch user info for all authors
      const usersMap = new Map()
      if (authorUserIds.length > 0) {
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('auth_user_id, first_name, last_name, email')
          .in('auth_user_id', authorUserIds)
        
        if (userData) {
          userData.forEach(user => {
            usersMap.set(user.auth_user_id, user)
          })
        }
      }

      const notesWithAuthors = (notes || []).map(note => {
        let authorName = 'Unknown User'
        
        if (note.author_user_id === 'system') {
          authorName = 'System'
        } else if (note.author_user_id && usersMap.has(note.author_user_id)) {
          const user = usersMap.get(note.author_user_id)
          const firstName = user.first_name || ''
          const lastName = user.last_name || ''
          authorName = firstName || lastName ? `${firstName} ${lastName}`.trim() : user.email || 'Admin User'
        }

        return { ...note, author_name: authorName }
      })

      console.log('✅ Notes fetched:', notesWithAuthors?.length || 0)
      return NextResponse.json({ success: true, notes: notesWithAuthors })
    }

    // Fetch incident attachments
    if (type === 'attachments' && incidentId) {
      console.log('🔥 Fetching attachments for incident:', incidentId)
      
      const { data: attachments, error } = await supabaseAdmin
        .from('incident_attachment')
        .select('*')
        .eq('incident_id', incidentId)
        .order('uploaded_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching attachments:', error)
        return NextResponse.json({ error: 'Failed to fetch attachments', details: error.message }, { status: 500 })
      }

      console.log('✅ Attachments fetched:', attachments?.length || 0)
      return NextResponse.json({ success: true, attachments: attachments || [] })
    }

    // 🔥 FETCH ALL INCIDENTS (MAIN QUERY) - Using parallel queries like dashboard
    console.log('🔥 Fetching all incidents at:', new Date().toISOString())
    console.log('👤 User role:', userRole.role)
    console.log('👤 User ID:', user.id)
    
    // Run the main query - NO FILTERS, just like dashboard does
    const incidentsPromise = supabaseAdmin
      .from('incident')
      .select(`
        incident_id,
        ticket_num,
        title,
        reporter_user_id,
        reporter_email,
        assignee_user_id,
        assignee_user_email,
        module_id,
        issue_type_id,
        severity_id,
        derived_severity_score,
        requires_manual_severity_review,
        status,
        priority,
        description,
        submitted_at,
        updated_at,
        resolved_at,
        affected_module!inner(module_id, module_name),
        issue_type!inner(issue_type_id, issue_type_name),
        severity_level!inner(severity_id, severity_name)
      `)
      .order('submitted_at', { ascending: false })
    
    // Execute query
    const { data: rawIncidents, error: queryError } = await incidentsPromise

    console.log('📊 Raw query results:', {
      returnedCount: rawIncidents?.length,
      queryError: queryError?.message
    })

    if (queryError) {
      console.error('❌ Error fetching incidents:', queryError)
      return NextResponse.json({ 
        error: 'Failed to fetch incidents', 
        details: queryError.message 
      }, { status: 500 })
    }

    // 🔍 Debug: Log first few incidents
    if (rawIncidents && rawIncidents.length > 0) {
      console.log('🎫 Sample incidents (first 3):', rawIncidents.slice(0, 3).map(i => ({
        ticket_num: i.ticket_num,
        title: i.title,
        status: i.status,
        submitted_at: i.submitted_at,
        updated_at: i.updated_at
      })))
    } else {
      console.warn('⚠️ No incidents returned from query!')
    }

    const formattedIncidents = rawIncidents?.map(incident => ({
      incident_id: incident.incident_id,
      ticket_num: incident.ticket_num,
      title: incident.title,
      reporter_user_id: incident.reporter_user_id,
      reporter_email: incident.reporter_email,
      assignee_user_id: incident.assignee_user_id,
      assignee_user_email: incident.assignee_user_email,
      module_id: incident.module_id,
      module_name: incident.affected_module.module_name,
      issue_type_id: incident.issue_type_id,
      issue_type_name: incident.issue_type.issue_type_name,
      severity_id: incident.severity_id,
      severity_name: incident.severity_level.severity_name,
      derived_severity_score: incident.derived_severity_score,
      requires_manual_severity_review: incident.requires_manual_severity_review,
      status: incident.status,
      priority: incident.priority,
      description: incident.description,
      submitted_at: incident.submitted_at,
      updated_at: incident.updated_at,
      resolved_at: incident.resolved_at
    })) || []

    const end = performance.now()
    console.log(`⏱️ API execution time: ${(end - start).toFixed(2)} ms`)
    console.log('✅ Incidents fetched:', formattedIncidents.length)
    
    if (formattedIncidents.length > 0) {
      console.log('📅 Latest incident:', {
        ticket: formattedIncidents[0]?.ticket_num,
        submitted: formattedIncidents[0]?.submitted_at,
        updated: formattedIncidents[0]?.updated_at
      })
    }

    return NextResponse.json({ 
      success: true, 
      incidents: formattedIncidents,
      count: formattedIncidents.length,
      timestamp: new Date().toISOString(),
      executionTime: `${(end - start).toFixed(2)}ms`
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    })

  } catch (error) {
    console.error('💥 Unexpected error in GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

  try {
    const body = await request.json()
    const { 
      incident_id, 
      status, 
      priority,
      assignee_user_id,
      note_body, 
      note_type, 
      author_user_id 
    } = body

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    if (!incident_id) {
      return NextResponse.json({ error: "Incident ID is required" }, { status: 400 })
    }

    console.log('🔄 Updating incident:', incident_id)
    console.log('📦 Update data:', { status, priority, assignee_user_id, has_note: !!note_body })

    const hasStatusChange = status !== undefined
    const hasPriorityChange = priority !== undefined
    const hasAssigneeChange = assignee_user_id !== undefined
    const hasNote = note_body && note_body.trim()

    if (!hasStatusChange && !hasPriorityChange && !hasAssigneeChange && !hasNote) {
      return NextResponse.json({ error: "No changes to update" }, { status: 400 })
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    const changes: string[] = []

    if (hasStatusChange) {
      updateData.status = status
      changes.push(`status to ${status}`)
      
      if (status === 'Resolved') {
        updateData.resolved_at = new Date().toISOString()
      } else {
        updateData.resolved_at = null
      }
    }

    if (hasPriorityChange) {
      updateData.priority = priority
      changes.push(`priority to ${priority}`)
    }

    if (hasAssigneeChange) {
      updateData.assignee_user_id = assignee_user_id
      
      if (assignee_user_id) {
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('email')
          .eq('auth_user_id', assignee_user_id)
          .single()
        
        if (userData) {
          updateData.assignee_user_email = userData.email
          changes.push(`assigned to ${userData.email}`)
        } else {
          updateData.assignee_user_id = null
          updateData.assignee_user_email = null
          changes.push('unassigned (assignee not found)')
        }
      } else {
        updateData.assignee_user_email = null
        changes.push('unassigned')
      }
    }

    const keysToUpdate = Object.keys(updateData).filter(key => key !== 'updated_at' && key !== 'resolved_at')
    
    if (keysToUpdate.length > 0 || updateData.resolved_at !== undefined) {
      const { error: updateError } = await supabaseAdmin
        .from('incident')
        .update(updateData)
        .eq('incident_id', incident_id)

      if (updateError) {
        console.error('❌ Error updating incident:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update incident', 
          details: updateError.message 
        }, { status: 500 })
      }

      console.log('✅ Incident updated successfully')
    }

    if (hasNote || changes.length > 0) {
      let noteBodyText = ''
      let finalNoteType = note_type || 'comment'

      if (changes.length > 0 && hasNote) {
        noteBodyText = `${note_body.trim()}\n\n[Changes: ${changes.join(', ')}]`
        finalNoteType = note_type || 'comment'
      } else if (changes.length > 0) {
        noteBodyText = `Changed ${changes.join(', ')}`
        finalNoteType = 'system'
      } else if (hasNote) {
        noteBodyText = note_body.trim()
        finalNoteType = note_type || 'comment'
      }

      if (noteBodyText.length > 0) {
        const { error: noteError } = await supabaseAdmin
          .from('incident_note')
          .insert({
            incident_id,
            author_user_id: author_user_id || 'system',
            body: noteBodyText,
            note_type: finalNoteType,
            created_at: new Date().toISOString()
          })

        if (noteError) {
          console.error('❌ Error creating note:', noteError)
        } else {
          console.log('✅ Note created')
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Incident updated successfully',
      changes: changes.length > 0 ? changes : ['note added']
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('💥 Unexpected error in PUT:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
      // ✅ AUTH CHECK
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

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const incident_id = formData.get('incident_id') as string
    const uploaded_by_user_id = formData.get('uploaded_by_user_id') as string

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    if (!file || !incident_id) {
      return NextResponse.json({ error: 'File and incident ID are required' }, { status: 400 })
    }

    console.log('📎 Uploading attachment for incident:', incident_id)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`
    const storagePath = `incident-attachments/${incident_id}/${uniqueFileName}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('attachments')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Error uploading file:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload file', 
        details: uploadError.message 
      }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('attachments')
      .getPublicUrl(storagePath)

    const { error: dbError } = await supabaseAdmin
      .from('incident_attachment')
      .insert({
        incident_id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_url: urlData.publicUrl,
        uploaded_by_user_id: uploaded_by_user_id || 'unknown',
        uploaded_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('❌ Error saving attachment metadata:', dbError)
      await supabaseAdmin.storage
        .from('attachments')
        .remove([storagePath])
      
      return NextResponse.json({ 
        error: 'Failed to save attachment metadata', 
        details: dbError.message 
      }, { status: 500 })
    }

    console.log('✅ Attachment uploaded successfully')

    return NextResponse.json({ 
      success: true,
      message: 'File uploaded successfully',
      url: urlData.publicUrl
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      }
    })

  } catch (error) {
    console.error('💥 Unexpected error in POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}