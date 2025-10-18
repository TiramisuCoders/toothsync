// app/api/support/MyTickets/route.ts
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
  const ticketNum = searchParams.get('ticket_num');

  try {
    console.log('🔥 Fetching ticket:', ticketNum);

    if (!ticketNum) {
      return NextResponse.json({ 
        error: 'Ticket number is required', 
        success: false 
      }, { status: 400 });
    }

    // Fetch single ticket by ticket number
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
        resolved_at,
        closed_at
      `)
      .eq('ticket_num', ticketNum)
      .single();

    if (error || !ticketData) {
      console.error('❌ Ticket not found:', error);
      return NextResponse.json({ 
        error: 'Ticket not found', 
        success: false 
      }, { status: 404 });
    }

    console.log(`✅ Found ticket:`, ticketData.ticket_num);

    // Fetch related data
    const { data: moduleData } = await supabase
      .from('affected_module')
      .select('module_name')
      .eq('module_id', ticketData.module_id)
      .single();

    const { data: issueTypeData } = await supabase
      .from('issue_type')
      .select('issue_type_name')
      .eq('issue_type_id', ticketData.issue_type_id)
      .single();

    const { data: severityData } = await supabase
      .from('severity_level')
      .select('name')
      .eq('severity_id', ticketData.severity_id)
      .single();

    // Fetch notes
    const { data: notesData } = await supabase
      .from('incident_note')
      .select('note_id, incident_id, author_user_id, body, note_type, created_at')
      .eq('incident_id', ticketData.incident_id)
      .order('created_at', { ascending: false });

    // Fetch attachments
    const { data: attachmentsData } = await supabase
      .from('incident_attachment')
      .select('attachment_id, incident_id, file_name, file_size, file_type, storage_url, uploaded_by_user_id, uploaded_at')
      .eq('incident_id', ticketData.incident_id)
      .order('uploaded_at', { ascending: false });

    // Transform notes to match expected interface
    const transformedNotes = (notesData || []).map(note => ({
      note_id: note.note_id,
      incident_id: note.incident_id,
      author_user_id: note.author_user_id,
      author_name: 'User',
      author_email: ticketData.reporter_email,
      body: note.body,
      created_at: note.created_at,
      visibility: note.note_type === 'internal' ? 'internal' : 'public',
      is_system: note.note_type === 'system' || note.note_type === 'status_change'
    }));

    // Transform attachments to match expected interface
    const transformedAttachments = (attachmentsData || []).map(att => ({
      attachment_id: att.attachment_id,
      incident_id: att.incident_id,
      file_name: att.file_name,
      file_size: att.file_size,
      file_type: att.file_type,
      storage_url: att.storage_url,
      uploaded_by_user_id: att.uploaded_by_user_id,
      uploaded_at: att.uploaded_at
    }));

    // Transform data
    const transformedTicket = {
      incident_id: ticketData.incident_id,
      ticket_num: ticketData.ticket_num,
      title: ticketData.title,
      reporter_user_id: ticketData.reporter_user_id,
      reporter_email: ticketData.reporter_email,
      assigned_user_id: ticketData.assignee_user_id,
      assigned_user_name: ticketData.assignee_user_email?.split('@')[0] || 'Unassigned',
      affected_module_id: ticketData.module_id,
      affected_module_name: moduleData?.module_name || 'N/A',
      issue_type_id: ticketData.issue_type_id,
      issue_type_name: issueTypeData?.issue_type_name || 'N/A',
      severity_id: ticketData.severity_id,
      severity_name: severityData?.name || 'N/A',
      derived_severity_score: ticketData.derived_severity_score,
      status: ticketData.status,
      priority: ticketData.priority,
      description: ticketData.description,
      submitted_at: ticketData.submitted_at,
      updated_at: ticketData.updated_at,
      resolved_at: ticketData.resolved_at,
      notes: transformedNotes,
      attachments: transformedAttachments
    };

    return NextResponse.json({ 
      success: true, 
      ticket: transformedTicket
    });

  } catch (error) {
    console.error('💥 Error in my-tickets GET:', error);
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
    const { incident_id, status, note_body, note_type } = body;

    console.log('🔥 Updating ticket:', { incident_id, status, note_body, note_type });

    if (!incident_id) {
      return NextResponse.json({ 
        error: 'Incident ID is required', 
        success: false 
      }, { status: 400 });
    }

    // Fetch ticket data first
    const { data: ticketData, error: fetchError } = await supabase
      .from('incident')
      .select('*')
      .eq('incident_id', incident_id)
      .single();

    if (fetchError || !ticketData) {
      console.error('❌ Error fetching ticket:', fetchError);
      return NextResponse.json({ 
        error: 'Ticket not found', 
        details: fetchError?.message,
        success: false 
      }, { status: 404 });
    }

    let updated = false;

    // Update ticket status if provided and different
    if (status && status !== ticketData.status) {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Set resolved_at if status is Resolved
      if (status === 'Resolved' && ticketData.status !== 'Resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('incident')
        .update(updateData)
        .eq('incident_id', incident_id);

      if (updateError) {
        console.error('❌ Error updating ticket status:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update ticket status', 
          details: updateError.message,
          success: false 
        }, { status: 500 });
      }

      updated = true;
      console.log('✅ Status updated to:', status);

      // Add system note for status change
      const statusChangeNote = {
        incident_id,
        author_user_id: ticketData.reporter_user_id,
        body: `Status changed to ${status}`,
        note_type: 'status_change',
        created_at: new Date().toISOString()
      };

      await supabase
        .from('incident_note')
        .insert(statusChangeNote);
    }

    // Add user note if provided
    if (note_body && note_body.trim()) {
      const noteData = {
        incident_id,
        author_user_id: ticketData.reporter_user_id,
        body: note_body.trim(),
        note_type: note_type || 'comment',
        created_at: new Date().toISOString()
      };

      console.log('📝 Inserting note:', noteData);

      const { error: noteError, data: noteResult } = await supabase
        .from('incident_note')
        .insert(noteData)
        .select();

      if (noteError) {
        console.error('❌ Error adding note:', noteError);
        return NextResponse.json({ 
          error: 'Failed to add note', 
          details: noteError.message,
          success: false 
        }, { status: 500 });
      }

      console.log('✅ Note added:', noteResult);
      updated = true;
    }

    if (!updated) {
      return NextResponse.json({ 
        error: 'No changes to update', 
        success: false 
      }, { status: 400 });
    }

    // Update the updated_at timestamp
    await supabase
      .from('incident')
      .update({ updated_at: new Date().toISOString() })
      .eq('incident_id', incident_id);

    console.log('✅ Ticket updated successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Ticket updated successfully'
    });

  } catch (error) {
    console.error('💥 Error in my-tickets PATCH:', error);
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

    console.log('🔥 Uploading attachment:', { 
      filename: file?.name, 
      incident_id,
      size: file?.size 
    });

    if (!file || !incident_id || !uploaded_by_user_id) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        success: false 
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size exceeds 10MB limit', 
        success: false 
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${incident_id}/${timestamp}-${sanitizedFilename}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('attachments') // Changed from 'incident-attachments' to 'attachments'
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload file to storage', 
        details: uploadError.message,
        success: false 
      }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('attachments') // Changed from 'incident-attachments' to 'attachments'
      .getPublicUrl(storagePath);

    const storage_url = urlData.publicUrl;

    console.log('✅ File uploaded to storage:', storage_url);

    // Insert attachment record into database
    const { data: attachmentData, error: dbError } = await supabase
      .from('incident_attachment')
      .insert({
        incident_id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_url,
        uploaded_by_user_id,
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database insert error:', dbError);
      
      // Clean up uploaded file if DB insert fails
      await supabase.storage
        .from('incident-attachments')
        .remove([storagePath]);

      return NextResponse.json({ 
        error: 'Failed to save attachment record', 
        details: dbError.message,
        success: false 
      }, { status: 500 });
    }

    console.log('✅ Attachment saved to database:', attachmentData);

    // Update incident updated_at timestamp
    await supabase
      .from('incident')
      .update({ updated_at: new Date().toISOString() })
      .eq('incident_id', incident_id);

    return NextResponse.json({ 
      success: true,
      attachment: attachmentData,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('💥 Error in attachment upload:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = getSupabaseClient();

  try {
    const { searchParams } = new URL(request.url);
    const attachment_id = searchParams.get('attachment_id');

    console.log('🔥 Deleting attachment:', attachment_id);

    if (!attachment_id) {
      return NextResponse.json({ 
        error: 'Attachment ID is required', 
        success: false 
      }, { status: 400 });
    }

    // Get attachment record first
    const { data: attachment, error: fetchError } = await supabase
      .from('incident_attachment')
      .select('*')
      .eq('attachment_id', attachment_id)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json({ 
        error: 'Attachment not found', 
        success: false 
      }, { status: 404 });
    }

    // Extract storage path from URL
    const urlParts = attachment.storage_url.split('/incident-attachments/');
    const storagePath = urlParts[1] || null;

    // Delete from storage
    if (storagePath) {
      const { error: storageError } = await supabase
        .storage
        .from('incident-attachments')
        .remove([storagePath]);

      if (storageError) {
        console.error('⚠️ Storage deletion warning:', storageError);
        // Continue even if storage delete fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('incident_attachment')
      .delete()
      .eq('attachment_id', attachment_id);

    if (deleteError) {
      console.error('❌ Database deletion error:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete attachment', 
        details: deleteError.message,
        success: false 
      }, { status: 500 });
    }

    console.log('✅ Attachment deleted successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Attachment deleted successfully'
    });

  } catch (error) {
    console.error('💥 Error in attachment deletion:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 });
  }
}