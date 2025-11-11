// app/auth/callback/route.ts
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const type = searchParams.get("type")

  // Handle errors
  if (error) {
    return NextResponse.redirect(
      new URL(`/landing?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  // If this is a password recovery flow
  if (type === "recovery" || code) {
    // Redirect to your password update page with the code
    return NextResponse.redirect(
      new URL(`/update-password?code=${code}`, request.url)
    )
  }

  // Default redirect
  return NextResponse.redirect(new URL("/landing", request.url))
}