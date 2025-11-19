import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { db } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        company: true,
      },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const subscription = await db.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })

    const history = await db.auditLog.findMany({
      where: {
        userId: user.id,
        action: { in: ["REDEEM_COUPON", "SUBSCRIPTION_PAYMENT"] },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 20,
    })

    const usedCoupons = await db.coupon.findMany({
      where: {
        usedBy: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      subscription,
      history,
      usedCoupons,
    })
  } catch (error) {
    console.error("[SUBSCRIPTION_STATUS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
