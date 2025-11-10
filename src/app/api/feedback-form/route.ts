import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

export const dynamic = "force-dynamic"; // prevents build from executing this API route

// ✅ Use the public URL + anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 📨 POST /api/feedback-form
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const {
      incident_id,
      overall_experience,
      issue_resolved,
      support_responsiveness,
      additional_comments,
    } = payload;

    // --- Basic validation ---
    if (
      !incident_id ||
      !overall_experience ||
      !issue_resolved ||
      !support_responsiveness ||
      !additional_comments
    ) {
      return NextResponse.json(
        { error: 'Missing required feedback fields.' },
        { status: 400 }
      );
    }

    // Insert into your table
    const { data, error } = await supabase
      .from('system_feedback')
      .insert({
        incident_id,
        overall_experience,
        issue_resolved,
        support_responsiveness,
        additional_comments,
      });

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json(
        { error: error.message, details: 'Database insert failed.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error('Server Error:', err);
    return NextResponse.json(
      { error: 'Unexpected server error during feedback submission.' },
      { status: 500 }
    );
  }
}

// ⛔ Block GET
export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed' },
    { status: 405 }
  );
}
