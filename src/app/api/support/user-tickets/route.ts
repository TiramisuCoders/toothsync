// app/api/support/user-tickets/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from "next/server";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get('user_email');

  try {
    console.log('🔥 Fetching tickets for user:', userEmail);

    if (!userEmail) {
      return NextResponse.json({ 
        error: 'User email is required', 
        success: false 
      }, { status: 400 });
    }

    // Fetch all tickets for this user
    const { data: ticketsData, error } = await supabase
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
        status,
        priority,
        description,
        submitted_at,
        updated_at,
        resolved_at
      `)
      .eq('reporter_email', userEmail)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching tickets:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch tickets', 
        details: error.message,
        success: false 
      }, { status: 500 });
    }

    if (!ticketsData || ticketsData.length === 0) {
      console.log('✅ No tickets found for user');
      return NextResponse.json({ 
        success: true, 
        tickets: []
      });
    }

    console.log(`✅ Found ${ticketsData.length} tickets for user`);

    // Fetch all related data in parallel
    const moduleIds = [...new Set(ticketsData.map(t => t.module_id))];
    const issueTypeIds = [...new Set(ticketsData.map(t => t.issue_type_id))];
    const severityIds = [...new Set(ticketsData.map(t => t.severity_id))];
    const incidentIds = ticketsData.map(t => t.incident_id);

    const [modulesRes, issueTypesRes, severitiesRes, notesRes, attachmentsRes] = await Promise.all([
      supabase.from('affected_module').select('module_id, module_name').in('module_id', moduleIds),
      supabase.from('issue_type').select('issue_type_id, issue_type_name').in('issue_type_id', issueTypeIds),
      supabase.from('severity_level').select('severity_id, name').in('severity_id', severityIds),
      supabase.from('incident_note').select('*').in('incident_id', incidentIds).order('created_at', { ascending: false }),
      supabase.from('incident_attachment').select('*').in('incident_id', incidentIds).order('uploaded_at', { ascending: false })
    ]);

    // Get unique author user IDs from notes
    const authorUserIds = [...new Set((notesRes.data || [])
      .map(note => note.author_user_id)
      .filter(id => id && id !== 'system')
    )];

    // Fetch user info for all authors
    const usersMap = new Map();
    if (authorUserIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('auth_user_id, first_name, last_name, email')
        .in('auth_user_id', authorUserIds);
      
      (usersData || []).forEach(user => {
        usersMap.set(user.auth_user_id, user);
      });
    }

    // Create lookup maps
    const modulesMap = new Map(modulesRes.data?.map(m => [m.module_id, m.module_name]) || []);
    const issueTypesMap = new Map(issueTypesRes.data?.map(it => [it.issue_type_id, it.issue_type_name]) || []);
    const severitiesMap = new Map(severitiesRes.data?.map(s => [s.severity_id, s.name]) || []);
    
    // Group notes and attachments by incident_id
    const notesMap = new Map<string, any[]>();
    (notesRes.data || []).forEach(note => {
      if (!notesMap.has(note.incident_id)) {
        notesMap.set(note.incident_id, []);
      }
      notesMap.get(note.incident_id)!.push(note);
    });

    const attachmentsMap = new Map<string, any[]>();
    (attachmentsRes.data || []).forEach(att => {
      if (!attachmentsMap.has(att.incident_id)) {
        attachmentsMap.set(att.incident_id, []);
      }
      attachmentsMap.get(att.incident_id)!.push(att);
    });

    // Transform all tickets
    const transformedTickets = ticketsData.map(ticket => {
      const notes = (notesMap.get(ticket.incident_id) || []).map(note => {
        let authorName = 'User';
        let authorEmail = ticket.reporter_email;

        if (note.author_user_id === 'system') {
          authorName = 'System';
          authorEmail = 'system';
        } else if (note.author_user_id && usersMap.has(note.author_user_id)) {
          const user = usersMap.get(note.author_user_id);
          authorName = `${user.first_name} ${user.last_name}`.trim() || user.email;
          authorEmail = user.email;
        }

        return {
          note_id: note.note_id,
          incident_id: note.incident_id,
          author_user_id: note.author_user_id,
          author_name: authorName,
          author_email: authorEmail,
          body: note.body,
          created_at: note.created_at,
          visibility: note.note_type === 'internal' ? 'internal' : 'public',
          is_system: note.note_type === 'system' || note.note_type === 'status_change'
        };
      });

      const attachments = (attachmentsMap.get(ticket.incident_id) || []).map(att => ({
        attachment_id: att.attachment_id,
        incident_id: att.incident_id,
        file_name: att.file_name,
        file_size: att.file_size,
        file_type: att.file_type,
        storage_url: att.storage_url,
        uploaded_by_user_id: att.uploaded_by_user_id,
        uploaded_at: att.uploaded_at
      }));

      return {
        incident_id: ticket.incident_id,
        ticket_num: ticket.ticket_num,
        title: ticket.title,
        reporter_user_id: ticket.reporter_user_id,
        reporter_email: ticket.reporter_email,
        assigned_user_id: ticket.assignee_user_id,
        assigned_user_name: ticket.assignee_user_email || 'Unassigned',
        affected_module_id: ticket.module_id,
        affected_module_name: modulesMap.get(ticket.module_id) || 'N/A',
        issue_type_id: ticket.issue_type_id,
        issue_type_name: issueTypesMap.get(ticket.issue_type_id) || 'N/A',
        severity_id: ticket.severity_id,
        severity_name: severitiesMap.get(ticket.severity_id) || 'N/A',
        derived_severity_score: ticket.derived_severity_score,
        status: ticket.status,
        priority: ticket.priority,
        description: ticket.description,
        submitted_at: ticket.submitted_at,
        updated_at: ticket.updated_at,
        resolved_at: ticket.resolved_at,
        notes,
        attachments
      };
    });

    return NextResponse.json({ 
      success: true, 
      tickets: transformedTickets
    });

  } catch (error) {
    console.error('💥 Error in user-tickets GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 });
  }
}

// ADD PATCH handler for authenticated users
export async function PATCH(request: NextRequest) {
  const supabase = getSupabaseClient();

  try {
    const body = await request.json();
    const { incident_id, status, note_body, note_type, author_user_id, user_email } = body;

    console.log('📝 Updating ticket (authenticated):', incident_id);

    if (!incident_id) {
      return NextResponse.json({ 
        error: 'Incident ID is required', 
        success: false 
      }, { status: 400 });
    }

    if (!author_user_id || !user_email) {
      return NextResponse.json({ 
        error: 'User authentication is required', 
        success: false 
      }, { status: 400 });
    }

    // Verify user owns this ticket
    const { data: ticketData, error: ticketError } = await supabase
      .from('incident')
      .select('reporter_email, reporter_user_id')
      .eq('incident_id', incident_id)
      .single();

    if (ticketError || !ticketData) {
      return NextResponse.json({ 
        error: 'Ticket not found', 
        success: false 
      }, { status: 404 });
    }

    if (ticketData.reporter_email.toLowerCase() !== user_email.toLowerCase()) {
      return NextResponse.json({ 
        error: 'Unauthorized: You can only update your own tickets', 
        success: false 
      }, { status: 403 });
    }

    const hasStatusChange = !!status;
    const hasNote = note_body && note_body.trim();

    if (hasStatusChange && !hasNote) {
      return NextResponse.json({ 
        error: 'A note is required when changing the status', 
        success: false 
      }, { status: 400 });
    }

    // Update status if provided
    if (status) {
      const { error: updateError } = await supabase
        .from('incident')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'Resolved' ? { resolved_at: new Date().toISOString() } : {})
        })
        .eq('incident_id', incident_id);

      if (updateError) {
        console.error('❌ Error updating status:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update status', 
          details: updateError.message,
          success: false 
        }, { status: 500 });
      }

      // Add system note for status change
      await supabase.from('incident_note').insert({
        incident_id,
        author_user_id: 'system',
        body: `Status changed to: ${status}`,
        note_type: 'status_change',
        created_at: new Date().toISOString()
      });
    } else if (hasNote) {
      const { error: updateError } = await supabase
        .from('incident')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('incident_id', incident_id);

      if (updateError) {
        console.error('❌ Error updating timestamp:', updateError);
      }
    }

    // Add note if provided
    if (hasNote) {
      const { error: noteError } = await supabase
        .from('incident_note')
        .insert({
          incident_id,
          author_user_id: author_user_id,
          body: note_body.trim(),
          note_type: note_type || 'comment',
          created_at: new Date().toISOString()
        });

      if (noteError) {
        console.error('❌ Error adding note:', noteError);
        return NextResponse.json({ 
          error: 'Failed to add note', 
          details: noteError.message,
          success: false 
        }, { status: 500 });
      }
    }

    console.log('✅ Ticket updated successfully (authenticated)');

    return NextResponse.json({ 
      success: true,
      message: 'Ticket updated successfully'
    });

  } catch (error) {
    console.error('💥 Error in user-tickets PATCH:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 });
  }
}

// ADD POST handler for authenticated users to upload attachments
export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const incident_id = formData.get('incident_id') as string;
    const uploaded_by_user_id = formData.get('uploaded_by_user_id') as string;
    const user_email = formData.get('user_email') as string;

    console.log('📎 Uploading attachment (authenticated):', incident_id);

    if (!file || !incident_id || !uploaded_by_user_id || !user_email) {
      return NextResponse.json({ 
        error: 'File, incident ID, user ID, and email are required', 
        success: false 
      }, { status: 400 });
    }

    // Verify user owns this ticket
    const { data: ticketData, error: ticketError } = await supabase
      .from('incident')
      .select('reporter_email')
      .eq('incident_id', incident_id)
      .single();

    if (ticketError || !ticketData) {
      return NextResponse.json({ 
        error: 'Ticket not found', 
        success: false 
      }, { status: 404 });
    }

    if (ticketData.reporter_email.toLowerCase() !== user_email.toLowerCase()) {
      return NextResponse.json({ 
        error: 'Unauthorized: You can only upload to your own tickets', 
        success: false 
      }, { status: 403 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`;
    const storagePath = `incident-attachments/${incident_id}/${uniqueFileName}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('attachments')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Error uploading file:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload file', 
        details: uploadError.message,
        success: false 
      }, { status: 500 });
    }

    const { data: urlData } = supabase
      .storage
      .from('attachments')
      .getPublicUrl(storagePath);

    const { error: dbError } = await supabase
      .from('incident_attachment')
      .insert({
        incident_id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_url: urlData.publicUrl,
        uploaded_by_user_id: uploaded_by_user_id,
        uploaded_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('❌ Error saving attachment metadata:', dbError);
      await supabase.storage.from('attachments').remove([storagePath]);
      
      return NextResponse.json({ 
        error: 'Failed to save attachment metadata', 
        details: dbError.message,
        success: false 
      }, { status: 500 });
    }

    // Update incident timestamp
    await supabase
      .from('incident')
      .update({ updated_at: new Date().toISOString() })
      .eq('incident_id', incident_id);

    console.log('✅ Attachment uploaded successfully (authenticated)');

    return NextResponse.json({ 
      success: true,
      message: 'File uploaded successfully',
      url: urlData.publicUrl
    });

  } catch (error) {
    console.error('💥 Error in user-tickets POST:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 });
  }
}