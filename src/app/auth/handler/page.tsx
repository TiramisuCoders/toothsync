// app/auth/handler/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export default function AuthHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        console.log('Auth handler params:', { tokenHash, type })

        // If this is a recovery token, verify it
        if (type === 'recovery' && tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: tokenHash,
            email: '', // Email not required for recovery tokens
          })

          if (error) {
            console.error('Token verification error:', error)
            throw error
          }

          console.log('Recovery token verified, session established')
          router.push('/update-password')
          return
        }

        // Check if there's already a session (from hash)
        const { data, error } = await supabase.auth.getSession()

        if (error) throw error

        if (data?.session) {
          console.log('Session found from hash')
          router.push('/update-password')
        } else {
          console.log('No session found')
          router.push('/landing')
        }
      } catch (error: any) {
        console.error('Auth handler error:', error)
        router.push(`/landing?error=${encodeURIComponent(error.message || 'Authentication failed')}`)
      }
    }

    handleAuth()
  }, [router, tokenHash, type])

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-emerald-700 font-medium">Processing password reset...</p>
      </div>
    </div>
  )
}