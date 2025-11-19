import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth-config"
import { ADMIN_EMAIL } from "@/lib/utils"

// Function to generate a unique coupon code
function generateCouponCode(type: string): string {
  const prefix = type === "MONTHLY" ? "MES" : "AÑO"
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.email !== ADMIN_EMAIL) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { type } = body

    if (!type || (type !== "MONTHLY" && type !== "ANNUAL")) {
      return new NextResponse("Invalid type. Must be MONTHLY or ANNUAL", { status: 400 })
    }

    // Generate unique code
    let code = generateCouponCode(type)
    let attempts = 0
    const maxAttempts = 10

    // Ensure uniqueness
    while (attempts < maxAttempts) {
      const existing = await db.coupon.findUnique({
        where: { code },
      })

      if (!existing) break

      code = generateCouponCode(type)
      attempts++
    }

    if (attempts >= maxAttempts) {
      return new NextResponse("Failed to generate unique code. Please try again.", { status: 500 })
    }

    // Create coupon
    const coupon = await db.coupon.create({
      data: {
        code,
        type,
        status: "active",
      },
    })

    const user = await db.user.findUnique({
      where: { email: session.user.email! },
    })

    if (user) {
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: "GENERATE_COUPON",
          details: `Auto-generated coupon ${code} (${type})`,
        },
      })
    }

    return NextResponse.json(coupon)
  } catch (error) {
    console.error("[COUPON_GENERATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
