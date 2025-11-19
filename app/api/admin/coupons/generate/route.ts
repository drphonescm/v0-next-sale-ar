import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth-config"
import { ADMIN_EMAIL } from "@/lib/utils"

function generateCouponCode(type: string): string {
  const prefix = type === "MONTHLY" ? "MES" : "ANO"
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export async function POST(req: Request) {
  try {
    console.log("[v0] Starting coupon generation...")
    const session = await getServerSession(authOptions)

    if (!session || session.user?.email !== ADMIN_EMAIL) {
      console.log("[v0] Unauthorized attempt")
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { type } = body
    console.log("[v0] Coupon type:", type)

    if (!type || (type !== "MONTHLY" && type !== "ANNUAL")) {
      return new NextResponse("Invalid type. Must be MONTHLY or ANNUAL", { status: 400 })
    }

    let code = generateCouponCode(type)
    let attempts = 0
    const maxAttempts = 10

    console.log("[v0] Generated initial code:", code)

    while (attempts < maxAttempts) {
      const existing = await db.coupon.findUnique({
        where: { code },
      })

      if (!existing) {
        console.log("[v0] Code is unique")
        break
      }

      code = generateCouponCode(type)
      attempts++
      console.log("[v0] Code collision, regenerating. Attempt:", attempts)
    }

    if (attempts >= maxAttempts) {
      return new NextResponse("Failed to generate unique code. Please try again.", { status: 500 })
    }

    const coupon = await db.coupon.create({
      data: {
        code,
        type,
        status: "active",
      },
    })
    console.log("[v0] Coupon created:", coupon.id)

    try {
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
        console.log("[v0] Audit log created")
      }
    } catch (auditError) {
      console.error("[v0] Failed to create audit log (non-critical):", auditError)
    }

    return NextResponse.json(coupon)
  } catch (error) {
    console.error("[COUPON_GENERATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
