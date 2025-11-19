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

    // Si no hay fecha de fin, retornar el estado actual
    if (!endDate) return { status: subscription.status, subscription }

    if (now > endDate) {
      const gracePeriodEnd = new Date(endDate)
      gracePeriodEnd.setUTCDate(gracePeriodEnd.getUTCDate() + 7)
      gracePeriodEnd.setUTCHours(23, 59, 59, 999)

      if (now <= gracePeriodEnd && subscription.status === "active") {
        await db.subscription.update({
          where: { id: subscription.id },
          data: { status: "grace" },
        })
        
        await db.auditLog.create({
          data: {
            userId,
            action: "SUBSCRIPTION_GRACE",
            details: `Suscripción entró en periodo de gracia. Vencimiento: ${endDate.toLocaleDateString("es-AR")}. Bloqueo definitivo: ${gracePeriodEnd.toLocaleDateString("es-AR")}`,
          },
        }).catch(() => {}) // No-critical
        
        return { status: "grace", subscription: { ...subscription, status: "grace" } }
      }

      if (now > gracePeriodEnd) {
        await db.subscription.update({
          where: { id: subscription.id },
          data: { status: "blocked" },
        })

        await db.auditLog.create({
          data: {
            userId,
            action: "SUBSCRIPTION_BLOCKED",
            details: `Suscripción bloqueada automáticamente. Periodo de gracia terminó el ${gracePeriodEnd.toLocaleDateString("es-AR")}`,
          },
        }).catch(() => {}) // No-critical

        return { status: "blocked", subscription: { ...subscription, status: "blocked" } }
      }
    }

    return { status: subscription.status, subscription }
  } catch (error) {
    console.error("[v0] Error in checkSubscriptionStatus:", error)
    return { status: "blocked", subscription: null }
  }
}
