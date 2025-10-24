// app/api/incidents/route.ts
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

// GET - Fetch all incidents with filters
export async function GET(request: NextRequest) {
  const supabase = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const incident_id = searchParams.get('incident_id');

  try {
    console.log('🔥 Fetching incidents with filters:', { 
      status, 
      search,
      incident_id 
    });

    // If incident_id is provided, fetch single incident
    if (incident_id) {
      const { data: incident, error } = await supabase
        .from('incident')
        .select(`
          *,
          affected_module!fk_incident_module(module_name),
          issue_type!fk_incident_issue_type(issue_type_name),
          severity_level!fk_incident_severity(severity_name, sfia_level, response_time_hours)
        `)
        .eq('incident_id', incident_id)
        .single();

      if (error) {
        console.error('❌ Error fetching incident:', error);
        return NextResponse.json({ 
          error: 'Incident not found', 
          success: false 
        }, { status: 404 });
      }

      console.log('✅ Incident found:', incident.ticket_num);
      return NextResponse.json({ 
        success: true, 
        incident 
      });
    }

    // Build query for all incidents with proper joins
    let query = supabase
      .from('incident')
      .select(`
        *,
        affected_module!fk_incident_module(module_name),
        issue_type!fk_incident_issue_type(issue_type_name),
        severity_level!fk_incident_severity(severity_name, sfia_level, response_time_hours)
      `)
      .order('submitted_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`ticket_num.ilike.%${search}%,title.ilike.%${search}%,reporter_email.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: incidents, error } = await query;

    if (error) {
      console.error('❌ Error fetching incidents:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch incidents', 
        details: error.message,
        success: false 
      }, { status: 500 });
    }

    console.log(`✅ Found ${incidents?.length || 0} incidents`);

    // Transform data for easier frontend consumption
    const transformedIncidents = (incidents || []).map((incident: any) => {
      // Get severity name from the correct field
      const severityName = incident.severity_level?.severity_name || 'N/A';
      
      // Get module name
      const moduleName = incident.affected_module?.module_name || 'N/A';
      
      // Get issue type name
      const issueTypeName = incident.issue_type?.issue_type_name || 'N/A';
      
      return {
        incident_id: incident.incident_id,
        ticket_num: incident.ticket_num,
        title: incident.title,
        reporter_user_id: incident.reporter_user_id,
        reporter_email: incident.reporter_email,
        assignee_user_id: incident.assignee_user_id || undefined,
        assignee_user_email: incident.assignee_user_email || undefined,
        module_id: incident.module_id || '',
        module_name: moduleName,
        issue_type_id: incident.issue_type_id || '',
        issue_type_name: issueTypeName,
        severity_id: incident.severity_id || '',
        severity_name: severityName,
        derived_severity_score: incident.derived_severity_score || 0,
        requires_manual_severity_review: incident.requires_manual_severity_review || false,
        status: incident.status,
        priority: incident.priority,
        description: incident.description || '',
        submitted_at: incident.submitted_at,
        updated_at: incident.updated_at,
        resolved_at: incident.resolved_at || undefined
      };
    });

    return NextResponse.json({ 
      success: true, 
      incidents: transformedIncidents,
      count: transformedIncidents.length
    });

  } catch (error) {
    console.error('💥 Error in incidents GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 });
  }
}

// PUT - Update incident
export async function PUT(request: NextRequest) {
  const supabase = getSupabaseClient();

  try {
    const body = await request.json();
    const { 
      incident_id, 
      status,
      note_body,
      note_type,
      author_user_id
    } = body;

    console.log('🔥 Updating incident:', incident_id, 'to status:', status);

    if (!incident_id) {
      return NextResponse.json({ 
        error: 'Incident ID is required', 
        success: false 
      }, { status: 400 });
    }

    // Fetch current incident data
    const { data: currentIncident, error: fetchError } = await supabase
      .from('incident')
      .select('*')
      .eq('incident_id', incident_id)
      .single();

    if (fetchError || !currentIncident) {
      console.error('❌ Incident not found:', fetchError);
      return NextResponse.json({ 
        error: 'Incident not found', 
        success: false 
      }, { status: 404 });
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Only update status if provided
    if (status !== undefined && status !== currentIncident.status) {
      updateData.status = status;
      
      // Set resolved_at if status changed to Resolved
      if (status === 'Resolved' && currentIncident.status !== 'Resolved') {
        updateData.resolved_at = new Date().toISOString();
      }
      
      // Clear resolved_at if status changed from Resolved to something else
      if (status !== 'Resolved' && currentIncident.status === 'Resolved') {
        updateData.resolved_at = null;
      }
    }

    // Update incident
    const { data: updatedIncident, error: updateError } = await supabase
      .from('incident')
      .update(updateData)
      .eq('incident_id', incident_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating incident:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update incident', 
        details: updateError.message,
        success: false 
      }, { status: 500 });
    }

    console.log('✅ Incident updated successfully');

    // Create note if provided
    if (note_body && note_body.trim()) {
      const noteAuthorId = author_user_id || currentIncident.reporter_user_id;
      
      const { error: noteError } = await supabase
        .from('incident_note')
        .insert({
          incident_id,
          author_user_id: noteAuthorId,
          body: note_body,
          note_type: note_type || 'comment',
          created_at: new Date().toISOString()
        });
      
      if (noteError) {
        console.error('⚠️ Error adding note:', noteError);
      } else {
        console.log('✅ Note added successfully');
      }
    }

    return NextResponse.json({ 
      success: true,
      incident: updatedIncident,
      message: 'Incident updated successfully'
    });

  } catch (error) {
    console.error('💥 Error in incidents PUT:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 });
  }
}

// POST - Create new incident
export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();

  try {
    const body = await request.json();
    const {
      title,
      description,
      reporter_user_id,
      reporter_email,
      module_id,
      issue_type_id,
      severity_id,
      priority
    } = body;

    console.log('🔥 Creating new incident');

    // Validation
    if (!title || !reporter_user_id || !reporter_email) {
      return NextResponse.json({ 
        error: 'Title, reporter user ID, and reporter email are required', 
        success: false 
      }, { status: 400 });
    }

    // Generate ticket number (format: TS-YYYY-NNNNN)
    const year = new Date().getFullYear();
    
    // Get the count of tickets for this year
    const { count } = await supabase
      .from('incident')
      .select('*', { count: 'exact', head: true })
      .like('ticket_num', `TS-${year}-%`);

    const ticketNumber = (count || 0) + 1;
    const ticket_num = `TS-${year}-${String(ticketNumber).padStart(5, '0')}`;

    // Insert incident
    const { data: newIncident, error: insertError } = await supabase
      .from('incident')
      .insert({
        ticket_num,
        title,
        description: description || '',
        reporter_user_id,
        reporter_email,
        module_id: module_id || null,
        issue_type_id: issue_type_id || null,
        severity_id: severity_id || null,
        priority: priority || 'Medium Priority',
        status: 'Pending',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating incident:', insertError);
      return NextResponse.json({ 
        error: 'Failed to create incident', 
        details: insertError.message,
        success: false 
      }, { status: 500 });
    }

    console.log('✅ Incident created:', ticket_num);

    return NextResponse.json({ 
      success: true,
      incident: newIncident,
      message: 'Incident created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('💥 Error in incidents POST:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 });
  }
}