// app/auth/handler/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export default function AuthHandler() {
  const router = useRouter()

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Get the session from the hash (Supabase puts tokens in hash)
        const { data, error } = await supabase.auth.getSession()

        if (error) throw error

        if (data?.session) {
          console.log('Session found, redirecting to update-password')
          router.push('/update-password')
        } else {
          console.log('No session found, redirecting to landing')
          router.push('/landing')
        }
      } catch (error) {
        console.error('Auth handler error:', error)
        router.push('/landing?error=Authentication failed')
      }
    }

    handleAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-emerald-700 font-medium">Processing authentication...</p>
      </div>
    </div>
  )
}