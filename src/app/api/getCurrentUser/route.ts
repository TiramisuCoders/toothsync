// api/getCurrentUser/route.ts

import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  try {
    const { data, error: authError } = await supabase.auth.getUser();

    console.log("🔍 Auth Debug:");
    console.log("User ID:", data);
    console.log("Auth error:", authError);

    const user = data?.user;
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userRole, error: userError } = await supabase
      .from("users")
      .select("first_name, last_name, auth_user_id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (userError || !userRole) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    console.log("User role data:", userRole);
    console.log("Role value:", userRole?.role);
    console.log("Role type:", typeof userRole?.role);

    // Build response for clinicians
    if (userRole.role === "R01") {
      const userData = {
        name: `${userRole.first_name} ${userRole.last_name}`,
        role: "Clinician",
        id: userRole.auth_user_id,
      };

      console.log("✅ Returning clinician data:", userData);

      return Response.json({
        success: true,
        data: userData,
        user_id: user.id,
      });
    }

    // Default response for other roles
    return Response.json({
      success: true,
      data: {
        name: `${userRole.first_name} ${userRole.last_name}`,
        role: userRole.role,
        id: userRole.auth_user_id,
      },
      user_id: user.id,
    });
  } catch (error) {
    console.error("❌ Error in GET /api/getCurrentUser:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
