// app/auth/callback/route.ts

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Handle errors
  if (error) {
    const errorMessage = error_description || error
    return NextResponse.redirect(
      new URL(`/landing?error=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }

  // If there's a code, this is a callback from Supabase auth flow
  if (code) {
    try {
      // Create a Supabase client to exchange the code for a session
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        throw error
      }

      // Redirect to update-password page so user can set their new password
      const response = NextResponse.redirect(
        new URL('/update-password', request.url)
      )

      // Set the session cookie if needed
      if (data.session) {
        response.cookies.set('supabase-auth-token', data.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 3600,
        })
      }

      return response
    } catch (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(
        new URL('/landing?error=Failed to process password recovery', request.url)
      )
    }
  }

  // No code or error, redirect to landing
  return NextResponse.redirect(new URL('/landing', request.url))
}