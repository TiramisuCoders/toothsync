// app/api/support/NewTickets/route.ts
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// Generate ticket number
async function generateTicketNumber(supabase: any): Promise<string> {
  const year = new Date().getFullYear();
  
  const { count, error } = await supabase
    .from('incident')
    .select('*', { count: 'exact', head: true })
    .gte('submitted_at', `${year}-01-01`)
    .lt('submitted_at', `${year + 1}-01-01`);

  if (error) {
    console.error('Error getting ticket count:', error);
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `TS-${year}-${randomNum}`;
  }

  const ticketNumber = ((count || 0) + 1).toString().padStart(5, '0');
  return `TS-${year}-${ticketNumber}`;
}

// Get module_id from module name
async function getModuleId(supabase: any, moduleName: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('affected_module')
    .select('module_id')
    .eq('module_name', moduleName)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error getting module:', error);
    return null;
  }

  return data?.module_id || null;
}

// Get issue_type_id
async function getIssueTypeId(supabase: any, issueTypeName: string, moduleId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('issue_type')
    .select('issue_type_id')
    .eq('issue_type_name', issueTypeName)
    .eq('module_id', moduleId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error getting issue type:', error);
    return null;
  }

  return data?.issue_type_id || null;
}

// Get or create user
async function getOrCreateUser(supabase: any, email: string): Promise<string | null> {
  // First, try to find existing user by email
  const { data: existingUser, error: userError } = await supabase
    .from('users')
    .select('auth_user_id')
    .eq('email', email)
    .maybeSingle();

  console.log('🔍 User lookup for email:', email, '- Result:', existingUser, '- Error:', userError);

  if (existingUser?.auth_user_id) {
    console.log('✅ Found existing user:', existingUser.auth_user_id);
    return existingUser.auth_user_id;
  }

  // Try to get current authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    console.log('✅ Using authenticated user:', user.id);
    return user.id;
  }

  console.error('❌ User not found for email:', email);
  return null;
}

// Handle file uploads
async function handleFileUploads(
  supabase: any, 
  incidentId: string, 
  files: File[], 
  userId: string
): Promise<{ uploadedAttachments: any[]; errors: any[] }> {
  const uploadedAttachments: any[] = [];
  const errors: any[] = [];

  for (const file of files) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${incidentId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `incident-attachments/${fileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, fileData, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error for file:', file.name, uploadError);
        errors.push({ file: file.name, error: uploadError.message });
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      const { data: attachment, error: dbError } = await supabase
        .from('incident_attachment')
        .insert({
          incident_id: incidentId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_url: publicUrl,
          uploaded_by_user_id: userId,
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error for file:', file.name, dbError);
        errors.push({ file: file.name, error: dbError.message });
        await supabase.storage.from('attachments').remove([filePath]);
        continue;
      }

      uploadedAttachments.push(attachment);

    } catch (error) {
      console.error('Error processing file:', file.name, error);
      errors.push({ 
        file: file.name, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return { uploadedAttachments, errors };
}

// POST - Create ticket
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  try {
    console.log('📝 Processing ticket submission...');

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const affectedModule = formData.get('affectedModule') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const reportedBy = formData.get('reportedBy') as string;
    const files = formData.getAll('files') as File[];

    if (!title || !affectedModule || !category || !description || !reportedBy) {
      return NextResponse.json(
        { error: 'Missing required fields', success: false },
        { status: 400 }
      );
    }

    console.log('Ticket data:', { title, affectedModule, category, reportedBy });

    const reporterUserId = await getOrCreateUser(supabase, reportedBy);
    
    if (!reporterUserId) {
      console.error('❌ Could not get user ID');
      return NextResponse.json(
        { 
          error: 'System error: Unable to process user information.', 
          success: false 
        },
        { status: 500 }
      );
    }

    console.log('✅ Reporter user ID:', reporterUserId);

    const moduleId = await getModuleId(supabase, affectedModule);
    if (!moduleId) {
      return NextResponse.json(
        { error: `Module "${affectedModule}" not found`, success: false },
        { status: 400 }
      );
    }

    const issueTypeId = await getIssueTypeId(supabase, category, moduleId);
    if (!issueTypeId) {
      return NextResponse.json(
        { error: `Issue type "${category}" not found for the selected module`, success: false },
        { status: 400 }
      );
    }

    const ticketNumber = await generateTicketNumber(supabase);
    console.log('Generated ticket number:', ticketNumber);

    const { data: incident, error: incidentError } = await supabase
      .from('incident')
      .insert({
        ticket_num: ticketNumber,
        title: title,
        reporter_user_id: reporterUserId,
        reporter_email: reportedBy,
        module_id: moduleId,
        issue_type_id: issueTypeId,
        description: description,
        status: 'Pending',
        priority: 'Medium Priority',
        requires_manual_severity_review: true,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (incidentError) {
      console.error('Error creating incident:', incidentError);
      return NextResponse.json(
        { 
          error: 'Failed to create ticket', 
          details: incidentError.message,
          success: false 
        },
        { status: 500 }
      );
    }

    console.log('✅ Ticket created successfully:', incident.incident_id);

    let uploadResults: { uploadedAttachments: any[]; errors: any[] } = { uploadedAttachments: [], errors: [] };
    if (files && files.length > 0 && files[0].size > 0) {
      console.log('📎 Uploading attachments...');
      uploadResults = await handleFileUploads(supabase, incident.incident_id, files, reporterUserId);
      if (uploadResults.uploadedAttachments.length > 0) {
        console.log(`✅ Uploaded ${uploadResults.uploadedAttachments.length} attachment(s)`);
      }
      if (uploadResults.errors.length > 0) {
        console.warn('⚠️ Some attachments failed to upload:', uploadResults.errors);
      }
    }

    const submissionDate = new Date(incident.submitted_at).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return NextResponse.json({
      success: true,
      ticketNumber: ticketNumber,
      submissionDate: submissionDate,
      incidentId: incident.incident_id,
      attachmentsUploaded: uploadResults.uploadedAttachments.length,
      attachmentErrors: uploadResults.errors.length > 0 ? uploadResults.errors : undefined
    });

  } catch (error) {
    console.error('💥 Error in ticket submission:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// GET - Fetch data
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    console.log('📥 GET request - action:', action);

    if (action === 'modules') {
      console.log('🔍 Fetching modules from affected_module table...');
      
      const { data: modules, error } = await supabase
        .from('affected_module')
        .select('module_id, module_name')
        .eq('is_active', true)
        .order('module_name');

      console.log('📊 Modules result:', { modules, error });

      if (error) {
        console.error('❌ Error fetching modules:', error);
        return NextResponse.json({ 
          error: 'Failed to fetch modules', 
          details: error.message,
          success: false 
        }, { status: 500 });
      }

      if (!modules || modules.length === 0) {
        console.log('⚠️ No modules found in database');
        return NextResponse.json({ 
          success: true, 
          modules: [],
          message: 'No active modules found'
        });
      }

      console.log(`✅ Successfully fetched ${modules.length} modules`);
      return NextResponse.json({ success: true, modules });
    }

    if (action === 'issue_types') {
      const moduleId = searchParams.get('module_id');
      
      if (!moduleId) {
        return NextResponse.json({ error: 'module_id required', success: false }, { status: 400 });
      }

      const { data: issueTypes, error } = await supabase
        .from('issue_type')
        .select('issue_type_id, issue_type_name, description')
        .eq('module_id', moduleId)
        .eq('is_active', true)
        .order('issue_type_name');

      if (error) {
        console.error('Error fetching issue types:', error);
        return NextResponse.json({ error: 'Failed to fetch issue types', success: false }, { status: 500 });
      }

      return NextResponse.json({ success: true, issueTypes });
    }

    if (action === 'ticket') {
      const ticketNum = searchParams.get('ticket_num');

      if (!ticketNum) {
        return NextResponse.json({ error: 'Ticket number required', success: false }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('incident')
        .select(`
          *,
          affected_module:module_id(module_name),
          issue_type:issue_type_id(issue_type_name),
          severity_level:severity_id(name)
        `)
        .eq('ticket_num', ticketNum)
        .single();

      if (error) {
        console.error('Error fetching ticket:', error);
        return NextResponse.json({ error: 'Ticket not found', success: false }, { status: 404 });
      }

      return NextResponse.json({ success: true, ticket: data });
    }

    return NextResponse.json({ error: 'Invalid action parameter', success: false }, { status: 400 });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request', success: false },
      { status: 500 }
    );
  }
}