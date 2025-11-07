// app/api/incidents/route.ts
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const incidentId = searchParams.get('incident_id')

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

    // Fetch incident notes with author information
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

      // Get unique author user IDs (excluding 'system')
      const authorUserIds = [...new Set((notes || [])
        .map(note => note.author_user_id)
        .filter(id => id && id !== 'system')
      )]

      // Fetch user info for all authors
      const usersMap = new Map()
      if (authorUserIds.length > 0) {
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('auth_user_id, first_name, last_name, email')
          .in('auth_user_id', authorUserIds)
        
        if (userData) {
          userData.forEach(user => {
            usersMap.set(user.auth_user_id, user)
          })
        }
      }

      // Transform notes with author names
      const notesWithAuthors = (notes || []).map(note => {
        let authorName = 'Unknown User'
        
        if (note.author_user_id === 'system') {
          authorName = 'System'
        } else if (note.author_user_id && usersMap.has(note.author_user_id)) {
          const user = usersMap.get(note.author_user_id)
          
          const firstName = user.first_name || ''
          const lastName = user.last_name || ''
          
          if (firstName || lastName) {
            authorName = `${firstName} ${lastName}`.trim()
          } else {
            authorName = user.email || 'Admin User'
          }
        }

        return {
          ...note,
          author_name: authorName
        }
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

    // Fetch all incidents (default)
    console.log('🔥 Fetching all incidents...')
    
<<<<<<< HEAD
    const { data: incidents, error } = await supabaseAdmin
=======
    // Run the main query - NO FILTERS, just like dashboard does
    // ✅ CHANGED: Removed '!inner' from select string to use LEFT JOINs
    const incidentsPromise = supabaseAdmin
>>>>>>> a22a78e (fixed outdated incident records: chief)
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
        affected_module(module_id, module_name),
        issue_type(issue_type_id, issue_type_name),
        severity_level(severity_id, severity_name)
      `)
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching incidents:', error)
      return NextResponse.json({ error: 'Failed to fetch incidents', details: error.message }, { status: 500 })
    }

<<<<<<< HEAD
    const formattedIncidents = incidents?.map(incident => ({
=======
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

    // ✅ CHANGED: Formatting logic updated to handle null/undefined values from LEFT JOINs
    const formattedIncidents = rawIncidents?.map(incident => ({
>>>>>>> a22a78e (fixed outdated incident records: chief)
      incident_id: incident.incident_id,
      ticket_num: incident.ticket_num,
      title: incident.title,
      reporter_user_id: incident.reporter_user_id,
      reporter_email: incident.reporter_email,
      assignee_user_id: incident.assignee_user_id,
      assignee_user_email: incident.assignee_user_email,
      module_id: incident.module_id,
      // Handle null module 
      module_name: incident.affected_module?.module_name || 'Unknown Module',
      issue_type_id: incident.issue_type_id,
      // Handle null issue type
      issue_type_name: incident.issue_type?.issue_type_name || 'Unknown Issue Type',
      severity_id: incident.severity_id,
      // Handle null severity
      severity_name: incident.severity_level?.severity_name || 'Unknown Severity',
      derived_severity_score: incident.derived_severity_score,
      requires_manual_severity_review: incident.requires_manual_severity_review,
      status: incident.status,
      priority: incident.priority,
      description: incident.description,
      submitted_at: incident.submitted_at,
      updated_at: incident.updated_at,
      resolved_at: incident.resolved_at
    })) || []
    // END OF CHANGES

    console.log('✅ Incidents fetched:', formattedIncidents.length)
    return NextResponse.json({ 
      success: true, 
      incidents: formattedIncidents,
      count: formattedIncidents.length 
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

    console.log('🔍 Updating incident:', incident_id)
    console.log('📦 Update data:', { status, priority, assignee_user_id, has_note: !!note_body })

    const hasStatusChange = status !== undefined
    const hasPriorityChange = priority !== undefined
    const hasAssigneeChange = assignee_user_id !== undefined
    const hasNote = note_body && note_body.trim()

    // Allow note-only updates
    if (!hasStatusChange && !hasPriorityChange && !hasAssigneeChange && !hasNote) {
      return NextResponse.json({ error: "No changes to update" }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    const changes: string[] = []

    // Update status
    if (hasStatusChange) {
      updateData.status = status
      changes.push(`status to ${status}`)
      
      if (status === 'Resolved') {
        updateData.resolved_at = new Date().toISOString()
      } else {
        updateData.resolved_at = null
      }
    }

    // Update priority
    if (hasPriorityChange) {
      updateData.priority = priority
      changes.push(`priority to ${priority}`)
    }

    // Update assignee
    if (hasAssigneeChange) {
      updateData.assignee_user_id = assignee_user_id
      
      if (assignee_user_id) {
        // Fetch assignee email using auth_user_id
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

    // Update the incident if there are field changes
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

    // Create note - MODIFIED LOGIC
    if (hasNote || changes.length > 0) {
      let noteBodyText = ''
      let finalNoteType = note_type || 'comment'

      if (changes.length > 0 && hasNote) {
        // Both changes and note
        noteBodyText = `${note_body.trim()}\n\n[Changes: ${changes.join(', ')}]`
        finalNoteType = note_type || 'comment'
      } else if (changes.length > 0) {
        // Only changes (system note)
        noteBodyText = `Changed ${changes.join(', ')}`
        finalNoteType = 'system'
      } else if (hasNote) {
        // Only note
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
          // Don't fail the request if note creation fails
        } else {
          console.log('✅ Note created')
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Incident updated successfully',
      changes: changes.length > 0 ? changes : ['note added']
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

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique file name
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`
    const storagePath = `incident-attachments/${incident_id}/${uniqueFileName}`

    // Upload to Supabase Storage
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

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('attachments')
      .getPublicUrl(storagePath)

    // Save attachment metadata to database
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
      // Try to delete the uploaded file
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
    })

  } catch (error) {
    console.error('💥 Unexpected error in POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}