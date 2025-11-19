import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const topic = url.searchParams.get("topic") || url.searchParams.get("type")
    const id = url.searchParams.get("id") || url.searchParams.get("data.id")

    if (topic !== "payment") {
      return new NextResponse("OK", { status: 200 })
    }

    if (!id || !MP_ACCESS_TOKEN) {
      return new NextResponse("Missing ID or Token", { status: 400 })
    }

    // Get payment info
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
    })

    if (!mpRes.ok) {
      throw new Error("Failed to fetch payment")
    }

    const payment = await mpRes.json()

    if (payment.status === "approved") {
      const subscriptionId = payment.external_reference

      if (subscriptionId) {
        const subscription = await db.subscription.findUnique({
          where: { id: subscriptionId },
        })

        if (subscription && subscription.status !== "active") {
          const startDate = new Date()
          const endDate = new Date()
          if (subscription.plan === "MONTHLY") {
            endDate.setMonth(endDate.getMonth() + 1)
          } else {
            endDate.setFullYear(endDate.getFullYear() + 1)
          }

          await db.$transaction([
            db.subscription.update({
              where: { id: subscriptionId },
              data: {
                status: "active",
                startDate,
                endDate,
              },
            }),
            db.auditLog.create({
              data: {
                userId: subscription.userId,
                action: "PAYMENT_APPROVED",
                details: `Payment approved for subscription ${subscriptionId}`,
              },
            }),
          ])
        }
      }
    }

    return new NextResponse("OK", { status: 200 })
  } catch (error) {
    console.error("[WEBHOOK_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
