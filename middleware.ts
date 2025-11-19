import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { ADMIN_EMAIL } from "@/lib/utils"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuthenticated = !!token

  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard")
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")
  const isAuthRoute = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register")

  // Redirect to login if accessing protected routes without token
  if ((isDashboard || isAdminRoute) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Redirect to dashboard/admin if accessing auth routes with token
  if (isAuthRoute && isAuthenticated) {
    if (token?.email === ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/admin", req.url))
    }
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (isAuthenticated) {
    const isAdmin = token?.email === ADMIN_EMAIL

    // Si es admin y trata de entrar al dashboard, redirigir a admin
    if (isAdmin && isDashboard) {
      return NextResponse.redirect(new URL("/admin", req.url))
    }

    // Si NO es admin y trata de entrar a admin, redirigir a dashboard
    if (!isAdmin && isAdminRoute) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
}
