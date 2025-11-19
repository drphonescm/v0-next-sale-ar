import { db } from "@/lib/db"

export async function checkSubscriptionStatus(userId: string) {
  try {
    if (!userId) {
      console.log("[v0] No userId provided, blocking user")
      return { status: "blocked", subscription: null }
    }

    const subscription = await db.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    if (!subscription) {
      console.log("[v0] No subscription found for user:", userId, "- BLOCKING")
      return { status: "blocked", subscription: null }
    }

    const now = new Date()
    const endDate = subscription.endDate ? new Date(subscription.endDate) : null

    if (subscription.status === "pending" || subscription.status === "blocked") {
      console.log("[v0] Subscription is pending or blocked:", subscription.status, "- BLOCKING")
      return { status: "blocked", subscription }
    }

    if (!endDate) {
      console.log("[v0] Subscription has no end date, blocking for safety")
      return { status: "blocked", subscription }
    }

    if (now > endDate) {
      const gracePeriodEnd = new Date(endDate)
      gracePeriodEnd.setUTCDate(gracePeriodEnd.getUTCDate() + 7)
      gracePeriodEnd.setUTCHours(23, 59, 59, 999)

      if (now <= gracePeriodEnd && subscription.status === "active") {
        console.log("[v0] Subscription expired, entering grace period until:", gracePeriodEnd)
        
        await db.subscription.update({
          where: { id: subscription.id },
          data: { status: "grace" },
        })
        
        try {
          await db.auditLog.create({
            data: {
              userId,
              action: "SUBSCRIPTION_GRACE",
              details: `Suscripción entró en periodo de gracia. Vencimiento: ${endDate.toLocaleDateString("es-AR")}. Bloqueo definitivo: ${gracePeriodEnd.toLocaleDateString("es-AR")}`,
            },
          })
        } catch (err) {
          console.error("[v0] Failed to create audit log:", err)
        }
        
        return { status: "grace", subscription: { ...subscription, status: "grace" } }
      }

      if (now > gracePeriodEnd) {
        console.log("[v0] Grace period ended, blocking subscription")
        
        await db.subscription.update({
          where: { id: subscription.id },
          data: { status: "blocked" },
        })

        try {
          await db.auditLog.create({
            data: {
              userId,
              action: "SUBSCRIPTION_BLOCKED",
              details: `Suscripción bloqueada automáticamente. Periodo de gracia terminó el ${gracePeriodEnd.toLocaleDateString("es-AR")}`,
            },
          })
        } catch (err) {
          console.error("[v0] Failed to create audit log:", err)
        }

        return { status: "blocked", subscription: { ...subscription, status: "blocked" } }
      }
    }

    console.log("[v0] Subscription is active, expires:", endDate)
    return { status: subscription.status, subscription }
  } catch (error) {
    console.error("[v0] Error in checkSubscriptionStatus:", error)
    return { status: "blocked", subscription: null }
  }
}
