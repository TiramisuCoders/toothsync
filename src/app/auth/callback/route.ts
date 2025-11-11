// app/auth/callback/route.ts

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const { searchParams, hash } = url

  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  
  console.log('Auth Callback Debug:', {
    url: url.href,
    searchParams: Object.fromEntries(searchParams),
    hash: hash,
  })

  // Handle errors
  if (error) {
    const errorMessage = error_description || error
    console.error('Auth error:', errorMessage)
    return NextResponse.redirect(
      new URL(`/landing?error=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }

  // If there's a code, exchange it for a session
  if (code) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        throw error
      }

      console.log('Session established successfully')

      // Redirect to update-password page
      return NextResponse.redirect(
        new URL('/update-password', request.url)
      )
    } catch (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(
        new URL('/landing?error=Failed to process authentication', request.url)
      )
    }
  }

  // No code parameter found, redirect to landing
  console.log('No code found in callback')
  return NextResponse.redirect(new URL('/landing', request.url))
}