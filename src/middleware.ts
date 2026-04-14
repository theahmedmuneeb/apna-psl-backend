import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public routes that don't need authentication
  const isPublicRoute = 
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/wallet-bridge") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/new-password") ||
    pathname.startsWith("/pages/coming-soon") ||
    pathname.startsWith("/pages/not-found") ||
    pathname.startsWith("/pages/unauthorized") ||
    pathname.startsWith("/pages/maintenance") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")

  if (isPublicRoute) {
    return NextResponse.next()
  }

  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // No user = redirect to sign-in
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/sign-in"
    url.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(url)
  }

  // Check admin role
  const userMetadata = (user.user_metadata || {}) as Record<string, unknown>
  const appMetadata = (user.app_metadata || {}) as Record<string, unknown>

  const isAdmin =
    (typeof userMetadata.role === "string" && userMetadata.role.toLowerCase() === "admin") ||
    (typeof appMetadata.role === "string" && appMetadata.role.toLowerCase() === "admin") ||
    (Array.isArray(userMetadata.roles) && 
     userMetadata.roles.some((r) => typeof r === "string" && r.toLowerCase() === "admin")) ||
    (Array.isArray(appMetadata.roles) && 
     appMetadata.roles.some((r) => typeof r === "string" && r.toLowerCase() === "admin"))

  // Not admin = sign out and redirect
  if (!isAdmin) {
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = "/sign-in"
    url.searchParams.set("error", "admin_required")
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}


