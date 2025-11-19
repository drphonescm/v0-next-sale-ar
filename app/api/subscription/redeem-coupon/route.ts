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

    const coupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    })

    if (!coupon) {
      return new NextResponse("Cupón inválido", { status: 400 })
    }

    if (coupon.status === "used") {
      return new NextResponse("Este cupón ya ha sido utilizado", { status: 400 })
    }

    const startDate = new Date()
    const endDate = new Date()
    if (coupon.type === "MONTHLY") {
      endDate.setDate(endDate.getDate() + 30) // 30 días exactos
    } else if (coupon.type === "ANNUAL") {
      endDate.setDate(endDate.getDate() + 365) // 365 días exactos
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

    const [subscription] = await db.$transaction([
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
      db.auditLog.create({
        data: {
          userId: user.id,
          action: "REDEEM_COUPON",
          details: `Canjeó cupón ${code} (${coupon.type === "MONTHLY" ? "Mensual - 30 días" : "Anual - 365 días"}) - Vence: ${endDate.toLocaleDateString("es-AR")}`,
        },
      }),
    ])

    return NextResponse.json({ 
      success: true,
      message: "Suscripción activada exitosamente",
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      }
    })
  } catch (error) {
    console.error("[COUPON_REDEEM]", error)
    return new NextResponse("Error interno del servidor", { status: 500 })
  }
}
