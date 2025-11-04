// app/api/support/MyTickets/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from "next/server"

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
  const ticketNum = searchParams.get('ticket_num');
  const userEmail = searchParams.get('user_email');

  try {
    console.log('🔥 Fetching ticket:', ticketNum, 'for user:', userEmail);

    if (!ticketNum) {
      return NextResponse.json({ 
        error: 'Ticket number is required', 
        success: false 
      }, { status: 400 });
    }

    if (!userEmail) {
      return NextResponse.json({ 
        error: 'User email is required', 
        success: false 
      }, { status: 400 });
    }

    const { data: ticketData, error } = await supabase
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
      .eq('ticket_num', ticketNum)
      .single();

    if (error) {
      console.error('❌ Error fetching ticket:', error);
      return NextResponse.json({ 
        error: 'Ticket not found', 
        details: error.message,
        success: false 
      }, { status: 404 });
    }

    if (!ticketData) {
      console.log('❌ No ticket found');
      return NextResponse.json({ 
        error: 'Ticket not found',
        success: false 
      }, { status: 404 });
    }

    if (ticketData.reporter_email.toLowerCase() !== userEmail.trim().toLowerCase()) {
      console.log('❌ Email mismatch - Access denied');
      return NextResponse.json({ 
        error: 'Email does not match the ticket reporter. Please check your email and try again.',
        success: false 
      }, { status: 403 });
    }

    console.log('✅ Email verified - Fetching related data');

    const [moduleRes, issueTypeRes, severityRes, notesRes, attachmentsRes] = await Promise.all([
      supabase.from('affected_module').select('module_id, module_name').eq('module_id', ticketData.module_id).single(),
      supabase.from('issue_type').select('issue_type_id, issue_type_name').eq('issue_type_id', ticketData.issue_type_id).single(),
      supabase.from('severity_level').select('severity_id, name').eq('severity_id', ticketData.severity_id).single(),
      supabase.from('incident_note').select('*').eq('incident_id', ticketData.incident_id).order('created_at', { ascending: false }),
      supabase.from('incident_attachment').select('*').eq('incident_id', ticketData.incident_id).order('uploaded_at', { ascending: false })
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

    // Transform notes with author info
    const notes = (notesRes.data || []).map(note => {
      let authorName = 'User';
      let authorEmail = ticketData.reporter_email;

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

    const attachments = (attachmentsRes.data || []).map(att => ({
      attachment_id: att.attachment_id,
      incident_id: att.incident_id,
      file_name: att.file_name,
      file_size: att.file_size,
      file_type: att.file_type,
      storage_url: att.storage_url,
      uploaded_by_user_id: att.uploaded_by_user_id,
      uploaded_at: att.uploaded_at
    }));

    const transformedTicket = {
      incident_id: ticketData.incident_id,
      ticket_num: ticketData.ticket_num,
      title: ticketData.title,
      reporter_user_id: ticketData.reporter_user_id,
      reporter_email: ticketData.reporter_email,
      assigned_user_id: ticketData.assignee_user_id,
      assigned_user_name: ticketData.assignee_user_email || 'Unassigned',
      affected_module_id: ticketData.module_id,
      affected_module_name: moduleRes.data?.module_name || 'N/A',
      issue_type_id: ticketData.issue_type_id,
      issue_type_name: issueTypeRes.data?.issue_type_name || 'N/A',
      severity_id: ticketData.severity_id,
      severity_name: severityRes.data?.name || 'N/A',
      derived_severity_score: ticketData.derived_severity_score,
      status: ticketData.status,
      priority: ticketData.priority,
      description: ticketData.description,
      submitted_at: ticketData.submitted_at,
      updated_at: ticketData.updated_at,
      resolved_at: ticketData.resolved_at,
      notes,
      attachments
    };

    console.log('✅ Ticket fetched successfully');

    return NextResponse.json({ 
      success: true, 
      ticket: transformedTicket
    });

  } catch (error) {
    console.error('💥 Error in MyTickets GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = getSupabaseClient();

  try {
    const body = await request.json();
    const { incident_id, status, note_body, note_type, author_user_id } = body;

    console.log('📝 Updating ticket:', incident_id);

    if (!incident_id) {
      return NextResponse.json({ 
        error: 'Incident ID is required', 
        success: false 
      }, { status: 400 });
    }

    // Check if ticket is already finalized (Resolved or Cancelled)
    const { data: currentTicket, error: fetchError } = await supabase
      .from('incident')
      .select('status')
      .eq('incident_id', incident_id)
      .single();

    if (fetchError || !currentTicket) {
      console.error('❌ Error fetching ticket:', fetchError);
      return NextResponse.json({ 
        error: 'Ticket not found', 
        success: false 
      }, { status: 404 });
    }

    // Block updates to finalized tickets
    if (currentTicket.status === 'Resolved' || currentTicket.status === 'Cancelled') {
      console.log('❌ Attempt to modify finalized ticket');
      return NextResponse.json({ 
        error: `Cannot modify ${currentTicket.status.toLowerCase()} tickets`, 
        success: false 
      }, { status: 403 });
    }

    const hasStatusChange = !!status;
    const hasNote = note_body && note_body.trim();

    // Validate: if changing status, note is required
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
      // If only adding a note (no status change), still update the timestamp
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
          // Use provided author_user_id if available, otherwise use 'user' for external access
          author_user_id: author_user_id || 'user',
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

    console.log('✅ Ticket updated successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Ticket updated successfully'
    });

  } catch (error) {
    console.error('💥 Error in MyTickets PATCH:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const incident_id = formData.get('incident_id') as string;
    const uploaded_by_user_id = formData.get('uploaded_by_user_id') as string;

    console.log('📎 Uploading attachment for ticket:', incident_id);

    if (!file || !incident_id) {
      return NextResponse.json({ 
        error: 'File and incident ID are required', 
        success: false 
      }, { status: 400 });
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
        // Use provided user_id or default to 'user' for external access
        uploaded_by_user_id: uploaded_by_user_id || 'user',
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

    console.log('✅ Attachment uploaded successfully');

    return NextResponse.json({ 
      success: true,
      message: 'File uploaded successfully',
      url: urlData.publicUrl
    });

  } catch (error) {
    console.error('💥 Error in MyTickets POST:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 });
  }
}