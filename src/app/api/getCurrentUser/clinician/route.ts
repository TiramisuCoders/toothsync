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
      .select("first_name, last_name, auth_user_id, role, sex, email")
      .eq("auth_user_id", user.id)
      .single();

    if (userError || !userRole) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    console.log("User role data:", userRole);
    console.log("Role value:", userRole?.role);
    console.log("Role type:", typeof userRole?.role);

    // Build response for clinicians
    if (userRole.role === "R01" || userRole.role === "R02" ) {
      const { data: clincianUserData, error: clincianUserDataError } = await supabase
        .from("clinicians")
        .select("year_level, section, student_id")
        .eq("user_id", user.id)
        .single();

        console.log(clincianUserData)

      if (clincianUserDataError || !clincianUserData) {
        return Response.json({ error: "Clinician data not found" }, { status: 404 });
        }

      const userData = {
        id: userRole.auth_user_id,
        name: `${userRole.first_name} ${userRole.last_name}`,
        email: userRole.email,
        sex: userRole.sex,
        yearLevel:clincianUserData?.year_level,
        section: clincianUserData?.section,
        studentId: clincianUserData?.student_id,
      };

      return Response.json({
        success: true,
        data: userData,
        user_id: user.id,
      });
    } else if (userRole.role === "R03") {
    const { data: instructorUserData, error: instructorUserDataError } = await supabase
        .from("Instructors_Specialization")
        .select("specialized_procedure, instructors!inner(user_id)")
        .eq("instructors.user_id", user.id);

    console.log("Instructor Specialization:", instructorUserData);

    if (instructorUserDataError || !instructorUserData || instructorUserData.length === 0) {
        return Response.json({ error: "Instructor data not found" }, { status: 404 });
    }

    // Extract all specializations as an array of strings
    const procedures = instructorUserData.map((item: any) => item.specialized_procedure);

    const userData = {
        id: userRole.auth_user_id,
        name: `${userRole.first_name} ${userRole.last_name}`,
        email: userRole.email,
        sex: userRole.sex,
        procedures, // ⬅️ Now correctly stores an array
    };

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
