import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    console.log('Function started successfully');
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    console.log('Supabase URL exists:', !!supabaseUrl);
    console.log('Supabase Key exists:', !!supabaseKey);
    const supabaseClient = createClient(supabaseUrl ?? '', supabaseKey ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    // Get the procedure ID from request body
    let body;
    try {
      const rawBody = await req.text();
      console.log('Raw request body:', rawBody);
      body = JSON.parse(rawBody);
      console.log('Parsed body:', body);
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError.message);
      return new Response(JSON.stringify({
        error: 'Invalid JSON in request body',
        details: jsonError.message,
        success: false
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    const { prod_id, prod_ids, match_type = 'any' } = body;
    // Handle both single procedure and multiple procedures
    let procedureIds = [];
    if (prod_ids && Array.isArray(prod_ids)) {
      procedureIds = prod_ids;
    } else if (prod_id) {
      procedureIds = [
        prod_id
      ];
    } else {
      console.log('Missing prod_id or prod_ids parameter');
      return new Response(JSON.stringify({
        error: 'Missing prod_id or prod_ids parameter. Use prod_id for single procedure or prod_ids array for multiple procedures',
        success: false
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    console.log('Looking for chairs compatible with procedure IDs:', procedureIds);
    console.log('Match type:', match_type);
    // Find all chairs that are compatible with the requested procedures
    console.log('Querying Chair_Procedures table...');
    const { data: compatibleChairs, error: compatibilityError } = await supabaseClient.from('Chair_Procedures').select(`
        chair_id,
        prod_id,
        chair:chair_id (
          chair_id,
          is_active
        )
      `).in('prod_id', procedureIds);
    console.log('Chair_Procedures query result:', {
      compatibleChairs,
      error: compatibilityError
    });
    if (compatibilityError) {
      console.error('Compatibility error:', compatibilityError);
      throw compatibilityError;
    }
    if (!compatibleChairs || compatibleChairs.length === 0) {
      return new Response(JSON.stringify({
        message: 'No chairs are compatible with the requested procedures',
        success: false,
        available_chair: null,
        requested_procedures: procedureIds
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 404
      });
    }
    // Group chairs by chair_id to see which procedures each chair supports
    const chairProcedureMap = new Map();
    compatibleChairs.forEach((item)=>{
      if (!chairProcedureMap.has(item.chair_id)) {
        chairProcedureMap.set(item.chair_id, {
          chair: item.chair,
          procedures: []
        });
      }
      chairProcedureMap.get(item.chair_id).procedures.push(item.prod_id);
    });
    // Filter chairs based on match_type
    let validChairs = [];
    if (match_type === 'all') {
      // Chair must support ALL requested procedures
      validChairs = Array.from(chairProcedureMap.entries()).filter(([chairId, data])=>{
        const supportedProcedures = data.procedures;
        return procedureIds.every((procId)=>supportedProcedures.includes(procId));
      });
    } else {
      // Chair must support ANY of the requested procedures (default)
      validChairs = Array.from(chairProcedureMap.entries());
    }
    console.log(`Found ${validChairs.length} chairs with ${match_type} match criteria`);
    // Filter only active chairs
    const activeCompatibleChairs = validChairs.filter(([chairId, data])=>data.chair && data.chair.is_active === true);
    if (activeCompatibleChairs.length === 0) {
      return new Response(JSON.stringify({
        message: 'No active chairs are compatible with the requested procedures',
        success: false,
        available_chair: null,
        requested_procedures: procedureIds,
        match_type: match_type
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Get chair IDs for availability check
    const chairIds = activeCompatibleChairs.map(([chairId, data])=>chairId);
    // Check availability of compatible chairs
    console.log('Checking availability for chair IDs:', chairIds);
    const { data: chairAvailability, error: availabilityError } = await supabaseClient.from('Chair_Availability').select('chair_id, is_occupied').in('chair_id', chairIds);
    console.log('Chair_Availability query result:', {
      chairAvailability,
      error: availabilityError
    });
    if (availabilityError) {
      console.error('Availability error:', availabilityError);
      throw availabilityError;
    }
    // Find available chairs (not occupied)
    const availableChairs = chairAvailability?.filter((chair)=>chair.is_occupied === false) || [];
    if (availableChairs.length === 0) {
      return new Response(JSON.stringify({
        message: 'No available chairs for the requested procedures. All compatible chairs are currently occupied.',
        success: false,
        available_chair: null,
        compatible_chairs_count: activeCompatibleChairs.length,
        occupied_chairs_count: chairAvailability?.filter((chair)=>chair.is_occupied === true).length || 0,
        requested_procedures: procedureIds,
        match_type: match_type
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Get one available chair (first one found)
    const selectedChair = availableChairs[0];
    // Find which procedures the selected chair supports
    const selectedChairData = activeCompatibleChairs.find(([chairId, data])=>chairId === selectedChair.chair_id);
    const supportedProcedures = selectedChairData ? selectedChairData[1].procedures : [];
    // Get procedure details for response
    const { data: procedureData, error: procedureError } = await supabaseClient.from('procedure').select('procedure_id, name').in('procedure_id', procedureIds);
    if (procedureError) {
      console.warn('Could not fetch procedure details:', procedureError);
    }
    return new Response(JSON.stringify({
      message: 'Compatible chair found and available',
      success: true,
      available_chair: {
        chair_id: selectedChair.chair_id,
        is_occupied: selectedChair.is_occupied,
        supported_procedures: supportedProcedures
      },
      requested_procedures: procedureIds,
      match_type: match_type,
      procedures: procedureData || procedureIds.map((id)=>({
          procedure_id: id,
          name: 'Unknown'
        })),
      stats: {
        total_compatible_chairs: activeCompatibleChairs.length,
        total_available_chairs: availableChairs.length,
        selected_from_available: 1
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in find-compatible-chair function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      success: false
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
