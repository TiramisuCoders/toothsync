// app/api/support/NewTickets/route.ts

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
// Import the standard Supabase client for creating the privileged client
import { createClient } from '@supabase/supabase-js'; 

// ===============================================
// HELPER FUNCTIONS
// ===============================================

// Get an available user with role 'R04' to be the assignee
// Uses RPC on the privileged client to bypass RLS and implement random assignment.
async function findAssignee(supabase: any): Promise<{ id: string, email: string } | null> {
    try {
        console.log('🔍 Searching for available assignee with role R04 via RPC...');
        
        // Use RPC to call the SQL function that handles random selection and RLS bypass
        const { data, error } = await supabase.rpc('get_random_assignee_r04'); 

        if (error) {
            console.error('Error finding assignee (RPC failed):', error);
            return null;
        }

        if (!data || data.length === 0) {
            console.warn('⚠️ No active users found with role R04 for assignment.');
            return null;
        }

        const assignee = data[0]; 
        return {
            id: assignee.auth_user_id,
            email: assignee.email
        };

    } catch (error) {
        console.error('💥 Error in findAssignee:', error);
        return null;
    }
}


// Get module_id from module name (Unchanged)
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

// Get issue_type_id (Unchanged)
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

// Get or create user (Minor fix for case-insensitivity)
async function getOrCreateUser(supabase: any, email: string): Promise<string | null> {
    const lowerCaseEmail = email.toLowerCase();
    
    // First, try to find existing user by email
    const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('auth_user_id')
        .eq('email', lowerCaseEmail)
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

// Handle file uploads (Unchanged, uses reporterUserId)
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

// ===============================================
// POST - Create ticket
// ===============================================

export async function POST(request: NextRequest) {
    // Client for general database interaction (used for reporter lookup, file uploads)
    const supabaseGeneral = await createSupabaseServerClient(); 
    
    // Create the privileged client using the Service Role Key
    // This client bypasses RLS and is used for assignment lookup and the final insert.
    const supabasePrivileged = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!       // <-- CORRECTED ENV VAR NAME
    );


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

        // Use the general client for reporter lookup (assuming RLS allows this)
        const reporterUserId = await getOrCreateUser(supabaseGeneral, reportedBy);

        if (!reporterUserId) {
            console.error('❌ Could not get user ID (Reporter not found or logged in)');
            return NextResponse.json(
                {
                    error: 'The email provided is not registered in our system. Please use a registered account.',
                    success: false
                },
                { status: 401 }
            );
        }

        console.log('✅ Reporter user ID:', reporterUserId);

        const moduleId = await getModuleId(supabaseGeneral, affectedModule);
        if (!moduleId) {
            return NextResponse.json(
                { error: `Module "${affectedModule}" not found`, success: false },
                { status: 400 }
            );
        }

        const issueTypeId = await getIssueTypeId(supabaseGeneral, category, moduleId);
        if (!issueTypeId) {
            return NextResponse.json(
                { error: `Issue type "${category}" not found for the selected module`, success: false },
                { status: 400 }
            );
        }
        
        // --- 1. Ticket Number Generation (using RPC on Privileged Client) ---
        const { data: ticketNumResult, error: rpcError } = await supabasePrivileged.rpc('generate_ticket_number');

        if (rpcError) {
            console.error('❌ RPC Error generating ticket number:', rpcError);
            return NextResponse.json(
                { error: 'Failed to generate unique ticket number', success: false, details: rpcError.message },
                { status: 500 }
            );
        }

        const ticketNumber = ticketNumResult as string;
        console.log('Generated ticket number:', ticketNumber);
        // ------------------------------------------------------------------
        
        // --- 2. Assignee Lookup (using RPC on Privileged Client) ---
        const assignee = await findAssignee(supabasePrivileged);

        let assigneeUserId = assignee ? assignee.id : null;
        let assigneeUserEmail = assignee ? assignee.email : null;

        if (assigneeUserId) {
            console.log(`✅ Assigning ticket to: ${assigneeUserEmail} (${assigneeUserId})`);
        } else {
            console.log('⚠️ Could not find a default assignee. Ticket will be unassigned (Pending).');
        }
        // ------------------------------------------------------------


        // --- 3. Incident Insert (with fixes for status/priority/naming) ---
        // Uses supabasePrivileged for insertion.
        // Variables are renamed to 'newIncident' to fix the 'already declared' error.
        const { data: newIncident, error: incidentInsertError } = await supabasePrivileged
            .from('incident')
            .insert({
                ticket_num: ticketNumber,
                title: title,
                reporter_user_id: reporterUserId,
                reporter_email: reportedBy,
                module_id: moduleId,
                issue_type_id: issueTypeId,
                description: description,
                
                // FIX 1: Corrected status case to match ENUM: 'In Progress' or 'Pending'.
                status: assigneeUserId ? 'In Progress' : 'Pending', 
                
                // FIX 2: Corrected priority value to match ENUM.
                priority: 'Medium Priority', 
                
                requires_manual_severity_review: true,
                submitted_at: new Date().toISOString(),
                
                assignee_user_id: assigneeUserId,
                assignee_user_email: assigneeUserEmail, 
            })
            .select()
            .single();

        if (incidentInsertError) {
            // CRITICAL LOG: This will show any remaining constraint/RLS issues
            console.error('🚨 Error creating incident (Supabase error):', incidentInsertError.message, incidentInsertError.details); 
            return NextResponse.json(
                {
                    error: 'Failed to create ticket (Database constraint failed)',
                    details: incidentInsertError.message,
                    success: false
                },
                { status: 500 }
            );
        }

        console.log('✅ Ticket created successfully:', newIncident.incident_id);

        let uploadResults: { uploadedAttachments: any[]; errors: any[] } = { uploadedAttachments: [], errors: [] };
        // Use the general client for file upload as it uses the storage bucket key which may differ
        if (files && files.length > 0 && files[0].size > 0) {
            console.log('📎 Uploading attachments...');
            uploadResults = await handleFileUploads(supabaseGeneral, newIncident.incident_id, files, reporterUserId);
            if (uploadResults.uploadedAttachments.length > 0) {
                console.log(`✅ Uploaded ${uploadResults.uploadedAttachments.length} attachment(s)`);
            }
            if (uploadResults.errors.length > 0) {
                console.warn('⚠️ Some attachments failed to upload:', uploadResults.errors);
            }
        }

        const submissionDate = new Date(newIncident.submitted_at).toLocaleString('en-US', {
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
            incidentId: newIncident.incident_id,
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

// ===============================================
// GET - Fetch data (UNCHANGED)
// ===============================================

export async function GET(request: NextRequest) {
    // Uses the general client as this is a general read operation
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