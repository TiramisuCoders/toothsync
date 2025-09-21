"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase" // adjust this import if your client lives elsewhere

export default function SyncUserRole() {
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser()
        if (userErr || !userData?.user) {
          console.debug("No logged-in user to sync role for.", userErr)
          return
        }

        const authUser = userData.user

        // Fetch the role code from your users table
        const { data: userRecord, error } = await supabase
          .from("users")
          .select("role") // 👈 make sure this column name matches your schema
          .eq("auth_user_id", authUser.id)
          .single()

        if (error) {
          console.error("Failed to fetch role:", error)
          return
        }

        // Map DB role codes to exact folder names
        const roleMap: Record<string, string> = {
          R01: "clinician",             // /app/profile/clinician
          R02: "clerk",                 // /app/profile/clerk
          R03: "clinical-instructor",   // /app/profile/clinical-instructor
          R04: "chief-of-clinicians",   // /app/profile/chief-of-clinicians
        }

        if (userRecord?.role) {
          console.log("Fetched role from DB:", userRecord.role) // debug
          const mappedRole = roleMap[userRecord.role] || userRecord.role
          console.log("Mapped role:", mappedRole) // debug
          localStorage.setItem("role", mappedRole)
        } else {
          console.warn("No role value found in user record")
        }
      } catch (err) {
        console.error("SyncUserRole error:", err)
      }
    }

    fetchRole()
  }, [])

  return null
}
