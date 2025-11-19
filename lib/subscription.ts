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

    console.log("[v0] Checking subscription:", {
      id: subscription.id,
      status: subscription.status,
      plan: subscription.plan,
      startDate: subscription.startDate,
      endDate: endDate?.toISOString(),
      now: now.toISOString(),
    })

    // Si la suscripción ya está bloqueada o pendiente, mantenerla así
    if (subscription.status === "blocked" || subscription.status === "pending") {
      console.log("[v0] Subscription is", subscription.status, "- BLOCKING")
      return { status: "blocked", subscription }
    }

    if (!endDate) {
      console.log("[v0] Subscription has no end date, blocking for safety")
      return { status: "blocked", subscription }
    }

    const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    const endDateUTC = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate())

    console.log("[v0] Date comparison:", {
      nowUTC: new Date(nowUTC).toISOString(),
      endDateUTC: new Date(endDateUTC).toISOString(),
      isExpired: nowUTC > endDateUTC,
    })

    // Si la suscripción todavía está vigente
    if (nowUTC <= endDateUTC) {
      console.log("[v0] Subscription is ACTIVE and valid until:", endDate.toISOString())
      // Si estaba en grace, reactivarla
      if (subscription.status === "grace") {
        await db.subscription.update({
          where: { id: subscription.id },
          data: { status: "active" },
        })
        return { status: "active", subscription: { ...subscription, status: "active" } }
      }
      return { status: "active", subscription }
    }

    const gracePeriodEnd = new Date(endDate)
    gracePeriodEnd.setUTCDate(gracePeriodEnd.getUTCDate() + 7)
    gracePeriodEnd.setUTCHours(23, 59, 59, 999)

    const gracePeriodEndUTC = Date.UTC(
      gracePeriodEnd.getUTCFullYear(),
      gracePeriodEnd.getUTCMonth(),
      gracePeriodEnd.getUTCDate()
    )

    console.log("[v0] Subscription expired. Grace period ends:", gracePeriodEnd.toISOString())

    // Está dentro del periodo de gracia
    if (nowUTC <= gracePeriodEndUTC) {
      console.log("[v0] Within grace period until:", gracePeriodEnd.toISOString())
      
      if (subscription.status === "active") {
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
      }
      
      return { status: "grace", subscription: { ...subscription, status: "grace" } }
    }

    // Periodo de gracia terminado - bloquear
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
  } catch (error) {
    console.error("[v0] Error in checkSubscriptionStatus:", error)
    return { status: "blocked", subscription: null }
  }
}
