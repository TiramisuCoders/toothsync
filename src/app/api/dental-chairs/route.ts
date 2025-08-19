// app/api/dental-chairs/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ===== Helpers =====
function assertEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function adminClient() {
  const url = assertEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = assertEnv("SUPABASE_SERVICE_ROLE_KEY"); // service key bypasses RLS, ideal for debugging
  return createClient(url, key, { auth: { persistSession: false } });
}

type Row = {
  chair_id: string;
  status: "Available" | "Occupied" | "Under Maintenance" | null;
  procedures: string[] | null;
};

// ===== Normal GET (returns chairs) =====
export async function GET(req: Request) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";

  try {
    const supabase = adminClient();

    // 1) Quick connectivity sanity check
    const ping = await supabase.from("chair").select("chair_id").limit(1);
    if (ping.error && debug) {
      return NextResponse.json(
        { step: "ping chair", error: ping.error, hint: "Does table public.chair exist?" },
        { status: 500 },
      );
    }

    // 2) Actual view query
    const { data, error } = await supabase
      .from<Row>("dental_chair_status_v")
      .select("chair_id,status,procedures")
      .order("chair_id", { ascending: true });

    if (error) {
      if (debug) {
        return NextResponse.json(
          {
            step: "select view",
            message: "Error fetching dental chairs from view",
            error: {
              message: error.message,
              details: (error as any).details ?? null,
              hint: (error as any).hint ?? null,
              code: (error as any).code ?? null,
            },
            tips: [
              "Confirm the view name is exactly public.dental_chair_status_v",
              "If your base tables are mixed-case (\"Chair_Availability\", \"Chair_Procedures\"), ensure the VIEW uses quoted names",
              "Test in SQL Editor: SELECT * FROM public.dental_chair_status_v LIMIT 1;",
            ],
          },
          { status: 500 },
        );
      }
      return NextResponse.json({ message: "Error fetching dental chairs", error: error.message }, { status: 500 });
    }

    // 3) Success
    return NextResponse.json(
      (data ?? []).map((r) => ({
        id: r.chair_id,
        status: r.status,
        procedures: r.procedures ?? [],
        student: null,
      })),
      { status: 200 },
    );
  } catch (e: any) {
    if (debug) {
      return NextResponse.json(
        {
          step: "route crash",
          message: "Unexpected server error",
          error: e?.message ?? String(e),
          envPresent: {
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          },
          tips: [
            "Restart dev server after editing .env.local",
            "Ensure import paths are valid (this file should not import '@/lib/supabase/admin' for this debug build)",
          ],
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ message: "Internal server error", error: e?.message ?? String(e) }, { status: 500 });
  }
}
