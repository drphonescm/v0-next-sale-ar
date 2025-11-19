import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const subscriptionId = searchParams.get("subscriptionId")
  const plan = searchParams.get("plan")

  if (!subscriptionId) {
    return new NextResponse("Missing subscriptionId", { status: 400 })
  }

  // Simulate successful payment
  const startDate = new Date()
  const endDate = new Date()
  if (plan === "MONTHLY") {
    endDate.setMonth(endDate.getMonth() + 1)
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1)
  }

  const subscription = await db.subscription.findUnique({
    where: { id: subscriptionId },
  })

  if (subscription) {
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
          action: "MOCK_PAYMENT_APPROVED",
          details: `Mock payment approved for subscription ${subscriptionId}`,
        },
      }),
    ])
  }

  // Redirect to success page
  return NextResponse.redirect(new URL("/dashboard/subscription?status=success", req.url))
}
