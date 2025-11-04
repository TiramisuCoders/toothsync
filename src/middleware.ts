import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import {
  getRoleFromCode,
  getDefaultDashboard,
  extractRoleFromPath,
  isRoleBasedRoute,
  redirectPathToRole,
} from "./lib/role-utils"

export async function middleware(request: NextRequest) {
  console.log("[v0] Middleware running for path:", request.nextUrl.pathname)

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log("[v0] Supabase env vars missing - blocking all dashboard access")
    const path = request.nextUrl.pathname
    if (path.startsWith("/dashboard")) {
      const url = request.nextUrl.clone()
      url.pathname = "/landing"
      return NextResponse.redirect(url)
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.log("[v0] Auth error:", error.message)
    }
    user = data?.user || null
    console.log("[v0] User authenticated:", !!user)
  } catch (error) {
    console.log("[v0] Auth check failed:", error)
    user = null
  }

  const path = request.nextUrl.pathname

  const publicRoutes = ["/signup", "/auth/callback", "/landing", "/incident-management", "/api/support"]
  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route))

  console.log("[v0] Path:", path, "| Public route:", isPublicRoute, "| User:", !!user)

  if (!user && isRoleBasedRoute(path)) {
    console.log("[v0] Blocking unauthenticated access to role-based route")
    const url = request.nextUrl.clone()
    url.pathname = "landing"
    return NextResponse.redirect(url)
  }

  // If not authenticated and trying to access protected route
  if (!user && !isPublicRoute && path !== "/") {
    console.log("[v0] Redirecting to login - not authenticated")
    const url = request.nextUrl.clone()
    url.pathname = "/landing"
    return NextResponse.redirect(url)
  }

  // If authenticated, get user role and set cookie
  if (user) {
    const { data: userRecord } = await supabase.from("users").select("role").eq("auth_user_id", user.id).single()

    console.log("[v0] User role from DB:", userRecord?.role)

    if (userRecord?.role) {
      const userRole = getRoleFromCode(userRecord.role)
      console.log("[v0] Mapped role:", userRole)

      response.cookies.set("role", userRole, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      })

      // If on root path, redirect to default dashboard
      if (path === "/") {
        const defaultDashboard = getDefaultDashboard(userRole)
        console.log("[v0] Redirecting to default dashboard:", defaultDashboard)
        const url = request.nextUrl.clone()
        url.pathname = defaultDashboard
        return NextResponse.redirect(url)
      }

      if (isRoleBasedRoute(path)) {
        const pathRole = extractRoleFromPath(path)
        console.log("[v0] Path role:", pathRole, "| User role:", userRole)

        if (pathRole && pathRole !== userRole) {
          console.log("[v0] Role mismatch - redirecting to correct role path")
          const correctPath = redirectPathToRole(path, userRole)
          const url = request.nextUrl.clone()
          url.pathname = correctPath
          return NextResponse.redirect(url)
        }
      }
    } else {
      console.log("[v0] User authenticated but no role found in database")
      if (isRoleBasedRoute(path)) {
        const url = request.nextUrl.clone()
        url.pathname = "landing"
        return NextResponse.redirect(url)
      }
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
