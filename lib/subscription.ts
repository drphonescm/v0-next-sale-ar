import { db } from "@/lib/db"

export async function checkSubscriptionStatus(userId: string) {
  try {
    const subscription = await db.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    if (!subscription) return { status: "blocked", subscription: null }

    const now = new Date()
    const endDate = subscription.endDate ? new Date(subscription.endDate) : null

    if (subscription.status === "pending") {
      return { status: "blocked", subscription }
    }

    // If no end date (e.g. pending), return status
    if (!endDate) return { status: subscription.status, subscription }

    // Check if expired
    if (now > endDate && subscription.status === "active") {
      // Enter grace period
      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: "grace" },
      })
      
      await db.auditLog.create({
        data: {
          userId,
          action: "SUBSCRIPTION_GRACE",
          details: "Subscription entered grace period",
        },
      })
      
      return { status: "grace", subscription: { ...subscription, status: "grace" } }
    }

    // Check if grace period expired (7 days)
    const gracePeriodEnd = new Date(endDate)
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7)

    if (now > gracePeriodEnd && (subscription.status === "active" || subscription.status === "grace")) {
      // Block subscription
      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: "blocked" },
      })

      await db.auditLog.create({
        data: {
          userId,
          action: "SUBSCRIPTION_BLOCKED",
          details: "Subscription blocked due to non-payment",
        },
      })

      return { status: "blocked", subscription: { ...subscription, status: "blocked" } }
    }

    return { status: subscription.status, subscription }
  } catch (error) {
    console.error("[v0] Error in checkSubscriptionStatus:", error)
    return { status: "blocked", subscription: null }
  }
}
