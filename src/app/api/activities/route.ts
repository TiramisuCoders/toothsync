import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  
  try {
    const { data, error: authError } = await supabase.auth.getUser();
    const user = data?.user;
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userRole, error: roleError } = await supabase
      .from('users')
      .select('first_name, last_name, auth_user_id, role')
      .eq('auth_user_id', user.id)
      .single();

    if (roleError || !userRole) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const startOfDay = `${today}T00:00:00.000Z`;
    const endOfDay = `${today}T23:59:59.999Z`;

    let query = supabase
      .from("activities")
      .select(`
        record_id,
        clinician,
        created_at,
        status,
        users!activities_clinician_fkey(
          auth_user_id,
          first_name,
          last_name
        ),
        activity_records!activity_records_record_id_fkey(
          id,
          instructor_id,
          chair_id,
          time_in,
          time_out,
          request_id,
          instructors!activity_records_instructor_id_fkey(
            instructor_id,
            users!instructors_user_id_fkey(
              auth_user_id,
              first_name,
              last_name
            )
          ),
          chair!Activity_Records_chair_id_fkey(
            chair_name
          ),
          request!activity_records_request_id_fkey(
            patient_name,
            is_sanitized,
            shift
          ),
          activity_procedures!activity_procedures_rec_id_fkey(
            ap_id,
            status,
            remarks,
            procedure(
              procedure_id,
              name
            )
          )
        )
      `)
      .order("created_at", { ascending: false });

    switch (userRole.role) {
      case 'R01':
        query = query.eq("clinician", userRole.auth_user_id);
        break;
      case 'R03':
        const { data: instructorData } = await supabase
          .from("instructors")
          .select("instructor_id")
          .eq("user_id", userRole.auth_user_id)
          .single();
        if (instructorData) {
          query = query.eq("activity_records.instructor_id", instructorData.instructor_id);
        }
        break;
      case 'R02':
      case 'R04':
        break;
      default:
        return Response.json({ error: 'Invalid role' }, { status: 403 });
    }

    const { data: activities, error: activitiesError } = await query;
    if (activitiesError) {
      return Response.json({ error: 'Database error', details: activitiesError.message }, { status: 500 });
    }

    const transformedActivities = activities?.map(activity => {
      const activityRecord = Array.isArray(activity.activity_records) 
        ? activity.activity_records[0] 
        : activity.activity_records;

      const procedureDetails = activityRecord?.activity_procedures?.map(ap => ({
        id: ap.ap_id,
        name: ap.procedure?.name,
        status: ap.status,
        remarks: ap.remarks
      })) || [];

      return {
        id: activity.record_id,
        clinicianId: activity.clinician,
        clinicianName: activity.users ? `${activity.users.first_name} ${activity.users.last_name}`.trim() : 'N/A',
        patientName: activityRecord?.request?.patient_name || 'N/A',
        chair: activityRecord?.chair?.chair_name || 'N/A',
        instructorId: activityRecord?.instructors?.users?.auth_user_id || null,
        instructorName: activityRecord?.instructors?.users
          ? `${activityRecord.instructors.users.first_name} ${activityRecord.instructors.users.last_name}`.trim()
          : 'N/A',
        timeIn: activityRecord?.time_in
          ? new Date(activityRecord.time_in).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" })
          : null,
        timeOut: activityRecord?.time_out
          ? new Date(activityRecord.time_out).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" })
          : null,
        procedures: activityRecord?.activity_procedures?.map(ap => ap.procedure?.name).filter(Boolean) || [],
        procedureDetails,
        status: activity.status,
        sanitized: activityRecord?.request?.is_sanitized ? "Yes" : "No",
        date: activity.created_at,
        shift: activityRecord?.request?.shift || null
      }
    }) || [];

    return Response.json({ 
      success: true, 
      data: transformedActivities,
      user: {
        id: user.id,
        role: userRole.role,
        name: `${userRole.first_name} ${userRole.last_name}`
      },
    });
    
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
