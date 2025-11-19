import type React from "react"
import { checkSubscriptionStatus } from "@/lib/subscription"
import { ADMIN_EMAIL } from "@/lib/utils"
import { redirect } from 'next/navigation'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { DashboardLayoutClient } from "@/components/dashboard-layout-client"
import { db } from "@/lib/db"

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

  let userId: string | null = null
  try {
    const user = await db.user.findUnique({
      where: { email: session.user?.email || "" },
      select: { id: true }
    })
    userId = user?.id || null
  } catch (error) {
    console.error("[v0] Error fetching user from database:", error)
  }

  let status = "blocked"
  if (userId) {
    try {
      const result = await checkSubscriptionStatus(userId)
      status = result.status
      console.log("[v0] Subscription check for user", userId, "- status:", status)
    } catch (error) {
      console.error("[v0] Error checking subscription status:", error)
      status = "blocked"
    }
  } else {
    console.log("[v0] No userId found for session, blocking user")
  }
  
  const isBlocked = status === "blocked"
  const isGrace = status === "grace"

  console.log("[v0] Dashboard layout - isBlocked:", isBlocked, "isGrace:", isGrace)

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
