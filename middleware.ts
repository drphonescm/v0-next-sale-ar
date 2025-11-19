import withAuth from "next-auth/middleware"
import { NextResponse } from "next/server"
import { ADMIN_EMAIL } from "@/lib/utils"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.email === ADMIN_EMAIL
    const isDashboard = req.nextUrl.pathname.startsWith("/dashboard")
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")

    // Si es admin y trata de entrar al dashboard, redirigir a admin
    if (isAdmin && isDashboard) {
      return NextResponse.redirect(new URL("/admin", req.url))
    }

    // Si NO es admin y trata de entrar a admin, redirigir a dashboard
    if (!isAdmin && isAdminRoute) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
