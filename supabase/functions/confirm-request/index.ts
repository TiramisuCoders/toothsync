// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  const { name } = await req.json()
  const data = {
    message: `Hello ${name}!`,
  }

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/confirm-request' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/


// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { updateError } = await supabase
    .from("request")
    .update({ status: "Confirmed", clerk_id: updateAttendance.clerkId, is_sanitized: "TRUE"  })
    .eq("request_id", id)

    if (updateError ) {
      throw updateError 
    }

    const { data: latest, error: fetchError } = await supabase
        .from("record")
        .select("record_id")
        .order("createdAt", { ascending: false })
        .limit(1)

      let newRecId;
      const year = new Date().getFullYear();

      if (fetchError || !latest || latest.length === 0) {
        throw fetchError;
        // If no previous request or fetch failed, start with 0001
        newRecId = `ACT${year}-0001`;
      } else {
        const lastId = latest[0].request_id; // e.g., "RQST2025-0007"
        const lastNumber = parseInt(lastId.split("-")[1], 10); // Extract "0007" and convert to number
        const nextNumber = lastNumber + 1;
        newRecId = `ACT${year}-${nextNumber.toString().padStart(4, "0")}`;
      }

    const { error: insertError } = await supabase.from("request").insert({
        request_id: newRecId,
      })


    // TODO: Change the table_name to your table
    const { data, error } = await supabase.from('request').select('*')

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(JSON.stringify({ message: err?.message ?? err }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})