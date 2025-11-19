import type React from "react"
import { checkSubscriptionStatus } from "@/lib/subscription"
import { ADMIN_EMAIL } from "@/lib/utils"
import { redirect } from 'next/navigation'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { DashboardLayoutClient } from "@/components/dashboard-layout-client"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user?.email === ADMIN_EMAIL) {
    redirect("/admin")
  }

  let status = "blocked"
  try {
    const result = await checkSubscriptionStatus(session.user.id)
    status = result.status
  } catch (error) {
    console.error("[v0] Error checking subscription status:", error)
    status = "blocked"
  }
  
  const isBlocked = status === "blocked"
  const isGrace = status === "grace"

  return (
    <DashboardLayoutClient 
      session={session} 
      isBlocked={isBlocked} 
      isGrace={isGrace}
    >
      {children}
    </DashboardLayoutClient>
  )
}
