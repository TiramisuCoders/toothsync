import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

// Helper function to initialize Supabase client at request time
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use consistent naming with your other route
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Handles POST requests to /api/feedback-form
export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient(); // Initialize here, at request time
  
  try {
    const payload = await req.json();

    const {
      incident_id,
      overall_experience,
      issue_resolved,
      support_responsiveness,
      additional_comments,
    } = payload;

    // --- 1. Basic Validation ---
    if (!incident_id || !overall_experience || !issue_resolved || !support_responsiveness || !additional_comments) {
      return NextResponse.json({ error: 'Missing required feedback fields.' }, { status: 400 });
    }

    // --- 2. Data Insertion into system_feedback table ---
    const { data, error } = await supabase
      .from('system_feedback')
      .insert({
        incident_id,
        overall_experience,
        issue_resolved, // This must be the mapped value ('Resolved completely', etc.)
        support_responsiveness,
        additional_comments,
      });

    if (error) {
      console.error('Supabase Error:', error);
      // Supabase errors often contain constraint violation details (e.g., UUID format, CHECK constraint failure)
      return NextResponse.json(
        { error: error.message, details: 'Failed to insert feedback into database. Check constraints.' },
        { status: 500 }
      );
    }

    // --- 3. Success Response ---
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error('Server Error:', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred during feedback submission.' },
      { status: 500 }
    );
  }
}

// Optional: Block other HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}