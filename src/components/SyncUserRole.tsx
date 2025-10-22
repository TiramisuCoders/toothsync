"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { getRoleFromCode } from "@/lib/role-utils"

export default function SyncUserRole() {
  useEffect(() => {
    const syncRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        if (profile?.role) {
          const userRole = getRoleFromCode(profile.role)
          localStorage.setItem("role", userRole)
        }
      } else {
        localStorage.removeItem("role")
      }
    }

    syncRole()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncRole()
      } else {
        localStorage.removeItem("role")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return null
}
