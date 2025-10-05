import { createAuthenticatedSupabaseClient } from '@/lib/supabase-route';

export async function POST(request: NextRequest) {
  const supabase = await createAuthenticatedSupabaseClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user has clerk role (R02)
    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()
    
    if (userRole?.role !== 'R02') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, record_id } = body

    console.log(body)

    if (!record_id) {
      return Response.json({ error: 'Missing record_id' }, { status: 400 })
    }

    // Handle different actions
    if (action === 'timeout') {
      // Record timeout in activity_record
      const now = new Date();
      const manilaNow = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Manila" })
      );
      const currentTime = manilaNow.toISOString();

      const { data: timeoutData, error: timeoutError } = await supabase
        .from('activity_records')
        .update({ 
          time_out: currentTime
        })
        .eq('record_id', record_id)
        .select();

        console.log("⏱ Debug Timeout:");
console.log("record_id passed:", record_id);
        console.log(timeoutData)

      if (timeoutError) {
        console.error('Timeout error:', timeoutError)
        return Response.json({ 
          error: 'Failed to record timeout', 
          details: timeoutError.message 
        }, { status: 500 })
      }

      return Response.json({ 
        success: true, 
        data: timeoutData,
        message: 'Time out recorded successfully'
      }, { status: 200 })
    }

    // Original confirm action (resource matching)
    if (!action || action === 'confirm') {
      const edgeFunctionUrl = `${process.env.SUPABASE_URL}/functions/v1/resource-match`;
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          recId: record_id,
          clerkId: user.id
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          supabaseError: result.error || null,
          payload: result,
        };

        console.error("Edge function error:", errorDetails);
        
        return Response.json({ 
          error: 'Resource matching failed', 
          details: errorDetails, 
          success: false
        }, { status: response.status || 400 });
      }

      return Response.json({ 
        success: true, 
        result: result 
      }, { status: 200 });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in POST /api/attendance/clerk:', error)
    return Response.json({ 
      error: error.message || 'Failed to process request', 
      details: error.message 
    }, { status: 500 });
  }
}