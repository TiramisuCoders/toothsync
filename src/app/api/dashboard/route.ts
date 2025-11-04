import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const start = performance.now();
  const supabase = await createSupabaseServerClient();

  try {
    // 🔑 Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    // 🧑 Role info
    const { data: userRole, error: roleError } = await supabase
      .from("users")
      .select("first_name, last_name, auth_user_id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (roleError || !userRole)
      return Response.json({ error: "User not found" }, { status: 404 });

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Manila",
    });

    // ⚙️ Run heavy queries *in parallel*
    const [recordsRes, countsRes, distRes] = await Promise.all([
      supabase.rpc("get_activity_overview_dashboard", {
        p_role: userRole.role,
        p_user_id: userRole.auth_user_id,
        p_date: today
      }),
      supabase.rpc("get_dashboard_counts", {
        p_user_id: user.id,
        p_role: userRole.role,
      }),
      supabase.rpc("get_clinician_distribution", { p_date: today }),
    ]);

    // 🧱 Handle errors centrally
    if (recordsRes.error || countsRes.error || distRes.error) {
      console.error("RPC error(s):", {
        recordsErr: recordsRes.error,
        countsErr: countsRes.error,
        distErr: distRes.error,
      });
      return Response.json(
        { error: "Database error", details: "One or more RPC calls failed" },
        { status: 500 }
      );
    }

    console.log("Raw records from RPC:", recordsRes.data);

    // 🎨 Group activities by activity_id and aggregate procedures
    const activityMap = new Map();

    recordsRes.data?.forEach((r) => {
      const activityId = r.activity_id;

      if (!activityMap.has(activityId)) {
        // First time seeing this activity
        activityMap.set(activityId, {
          id: r.activity_id,  // activity_records.id
          record_id: r.record_id,
          clinicianName: r.clinician || "",
          patientName: r.patient_name || "",
          patientType: r.patient_type || "",
          instructorName: r.instructor || "",
          overall_status: r.overall_status || "",
          instructorId: r.instructor_id,
          chair: r.chair,
          date: r.date || today,  // ADDED: Include date
          timeIn: r.time_in
            ? new Date(r.time_in).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Manila",
              })
            : null,
          timeOut: r.time_out
            ? new Date(r.time_out).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Manila",
              })
            : null,
          procedures: [],
          procedureDetails: [],
          statuses: [], // Track all procedure statuses
          // ADDED: allRecords structure to match Records.tsx pattern
          allRecords: [],
        });
      }

      // Add procedure to this activity
      const activity = activityMap.get(activityId);
      if (r.procedure_name && !activity.procedures.includes(r.procedure_name)) {
        activity.procedures.push(r.procedure_name);
        activity.procedureDetails.push({
          ap_id: r.ap_id,  // CRITICAL: Include ap_id
          name: r.procedure_name,
          status: r.status,
          remarks: r.remarks || "",
        });
        activity.statuses.push(r.status);
      }
    });

    // Convert map to array and determine overall status
    const transformedRecords = Array.from(activityMap.values()).map(activity => {
      // 🔄 CRITICAL FIX: Sort procedures alphabetically for consistent ordering
      // This ensures procedures always appear in the same order
      const sortedIndices = activity.procedures
        .map((name, index) => ({ name, index }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(item => item.index);

      // Reorder arrays based on sorted indices
      const sortedProcedures = sortedIndices.map(i => activity.procedures[i]);
      const sortedProcedureDetails = sortedIndices.map(i => activity.procedureDetails[i]);
      const sortedStatuses = sortedIndices.map(i => activity.statuses[i]);

      // Determine overall activity status:
      // - If ANY procedure is "Cancelled", activity is "Cancelled"
      // - If ALL procedures are "Completed", activity is "Completed"
      // - Otherwise, activity is "In Progress"
      let overallStatus = "In Progress";
      
      if (sortedStatuses.includes("Cancelled")) {
        overallStatus = "Cancelled";
      } else if (sortedStatuses.every(s => s === "Completed")) {
        overallStatus = "Completed";
      }

      // ADDED: Build allRecords array with procedureStatuses (sorted)
      // This matches the Records.tsx structure
      const allRecords = [{
        id: activity.record_id,
        date: activity.date,
        timeIn: activity.timeIn,
        timeOut: activity.timeOut,
        instructorName: activity.instructorName,
        chair: activity.chair,
        procedureStatuses: sortedProcedureDetails.map(p => ({
          ap_id: p.ap_id,  // CRITICAL: Include ap_id here
          procedure: p.name,
          status: p.status,
          remarks: p.remarks || ""
        }))
      }];

      // Remove the temporary statuses array
      const { statuses, procedures, procedureDetails, ...activityWithoutStatuses } = activity;
      
      return {
        ...activityWithoutStatuses,
        procedures: sortedProcedures,  // ✅ Sorted procedures
        procedureDetails: sortedProcedureDetails,  // ✅ Sorted procedure details
        status: overallStatus,
        allRecords,  // ✅ Sorted allRecords
      };
    });

    const transformedClinicianDistribution =
      distRes.data?.map((item) => ({
        instructor_id: item.instructor_id,
        instructor_name: item.instructor_name,
        date: item.date,
        shift: item.shift,
        assigned_clinicians: item.assigned_clinicians,
      })) ?? [];

    // ⏱ Measure and log
    const end = performance.now();
    console.log(`⏰ API execution time: ${(end - start).toFixed(2)} ms`);
    console.log("✅ Grouped activities with sorted procedures:", transformedRecords);
    if (transformedRecords[0]) {
      console.log("📋 Sample procedures order:", transformedRecords[0].procedures);
    }

    return Response.json({
      success: true,
      data: transformedRecords,
      distribution: transformedClinicianDistribution,
      dashboard: countsRes.data,
      user: {
        id: user.id,
        role: userRole.role,
        name: `${userRole.first_name} ${userRole.last_name}`,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/dashboard:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}