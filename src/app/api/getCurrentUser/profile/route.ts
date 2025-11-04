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

    // Get base user information
    const { data: userRole, error: userError } = await supabase
    .from("users")
    .select(`
      first_name,
      last_name,
      auth_user_id,
      sex,
      email,
      contact_number,
      role
    `)
    .eq("auth_user_id", user.id)
    .single();

    console.log("User role data:", userRole);
    console.log("Role value:", userRole?.role);

    if (userError || !userRole) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const { data: role, error: roleError } = await supabase
    .from("roles")
    .select(`
      role_name
    `)
    .eq("role_id", userRole.role)
    .single();

      if (roleError || !role) {
      return Response.json({ error: "Role not found" }, { status: 404 });
    }

    // Base user data that all roles will have
    const baseUserData = {
      id: userRole.auth_user_id,
      firstName: userRole.first_name,
      lastName: userRole.last_name,
      name: `${userRole.first_name} ${userRole.last_name}`,
      email: userRole.email,
      sex: userRole.sex,
      contactNumber: userRole.contact_number,
      role: role.role_name,
    };

    // R01 = Clinician, R02 = Clerk
    if (userRole.role === "R01" || userRole.role === "R02") {
      const { data: clinicianData, error: clinicianDataError } = await supabase
        .from("clinicians")
        .select("year_level, student_id, enrollment_status")
        .eq("user_id", user.id)
        .single();

      console.log("Clinician/Clerk Data:", clinicianData);

      if (clinicianDataError || !clinicianData) {
        return Response.json({ 
          error: "Clinician/Clerk data not found" 
        }, { status: 404 });
      }

      const userData = {
        ...baseUserData,
        studentId: clinicianData.student_id,
        yearLevel: clinicianData.year_level,
        enrollmentStatus: clinicianData.enrollment_status,
      };

      return Response.json({
        success: true,
        data: userData,
        user_id: user.id,
      });
    } 
    
    // R03 = Clinical Instructor
    else if (userRole.role === "R03") {
      const { data: instructorData, error: instructorDataError } = await supabase
        .from("instructors")
        .select("instructor_id")
        .eq("user_id", user.id)
        .single();

      console.log("Instructor Data:", instructorData);

      if (instructorDataError || !instructorData) {
        return Response.json({ 
          error: "Instructor data not found" 
        }, { status: 404 });
      }

      // Get instructor specializations/departments
      const { data: specializationData, error: specializationError } = await supabase
        .from("Instructors_Specialization")
        .select("department, instructors!inner(user_id)")
        .eq("instructors.user_id", user.id);

      console.log("Instructor Specialization:", specializationData);

      if (specializationError || !specializationData || specializationData.length === 0) {
        return Response.json({ 
          error: "Instructor specialization not found" 
        }, { status: 404 });
      }

      // Extract departments/specialized procedures
      const specializedProcedures = specializationData.map((item: any) => item.department);

      const userData = {
        ...baseUserData,
        employeeId: instructorData.instructor_id,
        specializedProcedures: specializedProcedures,
      };

      return Response.json({
        success: true,
        data: userData,
        user_id: user.id,
      });
    }

    // Default response for other roles (only base user data)
    return Response.json({
      success: true,
      data: baseUserData,
      user_id: user.id,
    });

  } catch (error) {
    console.error("❌ Error in GET /api/getCurrentUser:", error);
    return Response.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}