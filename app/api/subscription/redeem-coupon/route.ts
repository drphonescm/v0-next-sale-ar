import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth-config"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const body = await req.json()
    const { code } = body

    if (!code) {
      return new NextResponse("Missing code", { status: 400 })
    }

    // 1. Validate Coupon
    const coupon = await db.coupon.findUnique({
      where: { code },
    })

    if (!coupon) {
      return new NextResponse("Invalid coupon code", { status: 400 })
    }

    if (coupon.status === "used") {
      return new NextResponse("This coupon has already been used", { status: 400 })
    }

    // 2. Calculate dates
    const startDate = new Date()
    const endDate = new Date()
    if (coupon.type === "MONTHLY") {
      endDate.setMonth(endDate.getMonth() + 1)
    } else if (coupon.type === "ANNUAL") {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }

    await db.subscription.updateMany({
      where: {
        userId: user.id,
        status: { in: ["active", "grace"] },
      },
      data: {
        status: "blocked",
      },
    })

    // 3. Transaction: Create Subscription, Update Coupon, Log
    const [subscription] = await db.$transaction([
      // Create Subscription
      db.subscription.create({
        data: {
          userId: user.id,
          plan: coupon.type,
          status: "active",
          startDate,
          endDate,
          paymentMethod: "coupon",
        },
      }),
      db.coupon.update({
        where: { id: coupon.id },
        data: {
          status: "used",
          usedBy: user.id,
        },
      }),
      // Audit Log
      db.auditLog.create({
        data: {
          userId: user.id,
          action: "REDEEM_COUPON",
          details: `Redeemed coupon ${code} for ${coupon.type} plan (expires ${endDate.toLocaleDateString()})`,
        },
      }),
    ])

    return NextResponse.json({ 
      success: true,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      }
    })
  } catch (error) {
    console.error("[COUPON_REDEEM]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
