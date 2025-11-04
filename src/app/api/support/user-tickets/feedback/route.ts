// app/api/support/user-tickets/feedback/route.ts
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
  const incident_id = searchParams.get('incident_id');

  try {
    console.log('📥 Fetching feedback for incident:', incident_id);

    if (!incident_id) {
      return NextResponse.json({ 
        error: 'Incident ID is required', 
        success: false 
      }, { status: 400 });
    }

    // Fetch feedback for this specific incident
    const { data: feedbackData, error } = await supabase
      .from('system_feedback')
      .select('*')
      .eq('incident_id', incident_id)
      .single();

    if (error) {
      // If no feedback found, return success with null feedback
      if (error.code === 'PGRST116') {
        console.log('✅ No feedback found for this incident');
        return NextResponse.json({ 
          success: true, 
          feedback: null 
        });
      }
      
      console.error('❌ Error fetching feedback:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch feedback', 
        details: error.message,
        success: false 
      }, { status: 500 });
    }

    console.log('✅ Feedback found');
    return NextResponse.json({ 
      success: true, 
      feedback: feedbackData 
    });

  } catch (error) {
    console.error('💥 Error in feedback GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 });
  }
}