// app/api/support/SubmitTicketForm/route.ts
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// ===============================================
// CONSTANTS
// ===============================================

// Modules restricted to Chief of Clinicians only
const RESTRICTED_MODULES = [
    'Data Management',
    'Security & Access Control',
    'System Operations'
];

// ===============================================
// HELPER FUNCTIONS
// ===============================================

// Get an available user with role 'R04' to be the assignee
async function findAssignee(supabase: any): Promise<{ id: string, email: string } | null> {
    try {
        console.log('🔍 Searching for available assignee with role R04 via RPC...');
        
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
    const lowerCaseEmail = email.toLowerCase();
    
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

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        console.log('✅ Using authenticated user:', user.id);
        return user.id;
    }

    console.error('❌ User not found for email:', email);
    return null;
}

// Handle file uploads - ALIGNED WITH OTHER ROUTES
async function handleFileUploads(
    supabase: any,
    incidentId: string,
    files: File[],
    userId: string
): Promise<{ uploadedAttachments: any[]; errors: any[] }> {
    const uploadedAttachments: any[] = [];
    const errors: any[] = [];

    console.log(`🔎 Starting upload of ${files.length} file(s) for incident ${incidentId}`);

    for (const file of files) {
        try {
            // Validate file size (10MB limit)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                console.warn(`⚠️ File ${file.name} exceeds 10MB limit`);
                errors.push({
                    file: file.name,
                    error: 'File size exceeds 10MB limit'
                });
                continue;
            }

            // Generate unique filename
            const timestamp = Date.now();
            const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            
            // 🟢 FIXED: Now matches NewTickets and MyTickets structure
            const storagePath = `incident-attachments/${incidentId}/${timestamp}-${sanitizedFilename}`;

            console.log(`📤 Uploading file: ${file.name} to path: ${storagePath}`);

            // Convert File to ArrayBuffer then to Buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('attachments')
                .upload(storagePath, buffer, {
                    contentType: file.type,
                    upsert: false
                });

            if (uploadError) {
                console.error(`❌ Storage upload error for ${file.name}:`, uploadError);
                errors.push({
                    file: file.name,
                    error: uploadError.message
                });
                continue;
            }

            // Get public URL
            const { data: urlData } = supabase
                .storage
                .from('attachments')
                .getPublicUrl(storagePath);

            const storage_url = urlData.publicUrl;

            console.log(`✅ File uploaded to storage: ${storage_url}`);

            // Insert attachment record into database
            const { data: attachmentData, error: dbError } = await supabase
                .from('incident_attachment')
                .insert({
                    incident_id: incidentId,
                    file_name: file.name,
                    file_size: file.size,
                    file_type: file.type,
                    storage_url: storage_url,
                    uploaded_by_user_id: userId,
                    uploaded_at: new Date().toISOString()
                })
                .select()
                .single();

            if (dbError) {
                console.error(`❌ Database insert error for ${file.name}:`, dbError);
                
                // Clean up uploaded file if DB insert fails
                await supabase.storage
                    .from('attachments')
                    .remove([storagePath]);

                errors.push({
                    file: file.name,
                    error: dbError.message
                });
                continue;
            }

            console.log(`✅ Attachment saved to database:`, attachmentData);
            uploadedAttachments.push(attachmentData);

        } catch (error) {
            console.error(`💥 Error uploading file ${file.name}:`, error);
            errors.push({
                file: file.name,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    console.log(`📊 Upload complete: ${uploadedAttachments.length} succeeded, ${errors.length} failed`);
    return { uploadedAttachments, errors };
}

// ===============================================
// POST - Create ticket
// ===============================================

export async function POST(request: NextRequest) {
    const supabaseGeneral = await createSupabaseServerClient(); 
    
    const supabasePrivileged = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        console.log('🔥 Processing ticket submission...');

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

        const moduleId = await getModuleId(supabasePrivileged, affectedModule);
        if (!moduleId) {
            return NextResponse.json(
                { error: `Module "${affectedModule}" not found`, success: false },
                { status: 400 }
            );
        }

        const issueTypeId = await getIssueTypeId(supabasePrivileged, category, moduleId);
        if (!issueTypeId) {
            return NextResponse.json(
                { error: `Issue type "${category}" not found for the selected module`, success: false },
                { status: 400 }
            );
        }
        
        // Generate ticket number
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
        
        // Find assignee
        const assignee = await findAssignee(supabasePrivileged);

        let assigneeUserId = assignee ? assignee.id : null;
        let assigneeUserEmail = assignee ? assignee.email : null;

        if (assigneeUserId) {
            console.log(`✅ Assigning ticket to: ${assigneeUserEmail} (${assigneeUserId})`);
        } else {
            console.log('⚠️ Could not find a default assignee. Ticket will be unassigned (Pending).');
        }

        // Insert incident
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
                status: assigneeUserId ? 'In Progress' : 'Pending', 
                priority: 'Medium Priority', 
                requires_manual_severity_review: true,
                submitted_at: new Date().toISOString(),
                assignee_user_id: assigneeUserId,
                assignee_user_email: assigneeUserEmail, 
            })
            .select()
            .single();

        if (incidentInsertError) {
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

        // Handle file uploads - now using privileged client for consistency
        let uploadResults: { uploadedAttachments: any[]; errors: any[] } = { uploadedAttachments: [], errors: [] };
        
        if (files && files.length > 0 && files[0].size > 0) {
            console.log('🔎 Uploading attachments...');
            // 🟢 CHANGED: Use privileged client for file uploads (matches NewTickets)
            uploadResults = await handleFileUploads(supabasePrivileged, newIncident.incident_id, files, reporterUserId);
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
// GET - Fetch Modules and Issue Types
// ===============================================

export async function GET(request: NextRequest) {
    const supabasePrivileged = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    try {
        if (action === 'modules') {
            console.log('🔥 Fetching modules from affected_module table...');
            
            // 🟢 Read role cookie to determine if user is Chief of Clinicians
            const cookieStore = await cookies();
            const roleCookie = cookieStore.get('role');
            const userRole = roleCookie?.value;
            
            console.log('👤 User role from cookie:', userRole);
            
            const { data: modules, error } = await supabasePrivileged
                .from('affected_module')
                .select('module_id, module_name')
                .eq('is_active', true);
                // Removed .order('module_name') to allow custom sorting

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

            // 🟢 FILTER MODULES BASED ON USER ROLE
            let filteredModules = modules;
            
            // Only Chief of Clinicians can see restricted modules
            if (userRole !== 'chief-of-clinicians') {
                filteredModules = modules.filter(
                    (module: { module_name: string }) => !RESTRICTED_MODULES.includes(module.module_name)
                );
                console.log(`🔒 Filtered restricted modules. Total: ${modules.length}, Available: ${filteredModules.length}`);
            } else {
                console.log(`👑 Chief of Clinicians - showing all ${modules.length} modules`);
            }
            
            // 🆕 CUSTOM SORTING LOGIC: Sort alphabetically, but move 'Others' to the end.
            const othersModuleIndex = filteredModules.findIndex(
                (module: { module_name: string }) => module.module_name.toLowerCase() === 'others'
            );
            
            let othersModule: any = null;
            if (othersModuleIndex !== -1) {
                // 1. Remove 'Others' module
                othersModule = filteredModules.splice(othersModuleIndex, 1)[0];
            }

            // 2. Sort the remaining modules alphabetically
            filteredModules.sort((a: { module_name: string }, b: { module_name: string }) => 
                a.module_name.localeCompare(b.module_name)
            );

            // 3. Append 'Others' module back to the end
            if (othersModule) {
                filteredModules.push(othersModule);
            }
            // 🔚 END CUSTOM SORTING LOGIC

            console.log(`✅ Successfully fetched modules for role: ${userRole || 'unknown'}`);
            return NextResponse.json({ success: true, modules: filteredModules });
        }

        if (action === 'issue_types') {
            const moduleId = searchParams.get('module_id');

            if (!moduleId) {
                return NextResponse.json({ 
                    error: 'module_id required', 
                    success: false 
                }, { status: 400 });
            }

            console.log('🔥 Fetching issue types for module:', moduleId);

            // 1. Fetch data WITHOUT database ordering
            const { data: issueTypes, error } = await supabasePrivileged
                .from('issue_type')
                .select('issue_type_id, issue_type_name')
                .eq('module_id', moduleId)
                .eq('is_active', true);
                // Removed .order('issue_type_name');

            console.log('📊 Issue types result:', { issueTypes, error });

            if (error) {
                console.error('❌ Error fetching issue types:', error);
                return NextResponse.json({ 
                    error: 'Failed to fetch issue types', 
                    details: error.message,
                    success: false 
                }, { status: 500 });
            }

            if (!issueTypes || issueTypes.length === 0) {
                console.log('⚠️ No issue types found for module:', moduleId);
                return NextResponse.json({
                    success: true,
                    issueTypes: [],
                    message: 'No active issue types found for this module'
                });
            }

            // 🆕 CUSTOM SORTING LOGIC: Sort alphabetically, but move 'Others' to the end.
            if (issueTypes && issueTypes.length > 0) {
                const othersIssueTypeIndex = issueTypes.findIndex(
                    (issueType: { issue_type_name: string }) => issueType.issue_type_name.toLowerCase() === 'others'
                );
                
                let othersIssueType: any = null;
                if (othersIssueTypeIndex !== -1) {
                    // Remove 'Others' issue type
                    othersIssueType = issueTypes.splice(othersIssueTypeIndex, 1)[0];
                }

                // Sort the remaining issue types alphabetically
                issueTypes.sort((a: { issue_type_name: string }, b: { issue_type_name: string }) => 
                    a.issue_type_name.localeCompare(b.issue_type_name)
                );

                // Append 'Others' issue type back to the end
                if (othersIssueType) {
                    issueTypes.push(othersIssueType);
                }
            }
            // 🔚 END CUSTOM SORTING LOGIC
            
            console.log(`✅ Successfully fetched ${issueTypes.length} issue types`);
            return NextResponse.json({ success: true, issueTypes });
        }

        return NextResponse.json({ 
            error: 'Invalid action parameter', 
            success: false 
        }, { status: 400 });

    } catch (error) {
        console.error('💥 Error processing request:', error);
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