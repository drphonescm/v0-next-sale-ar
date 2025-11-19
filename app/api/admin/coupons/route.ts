import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth-config"
import { ADMIN_EMAIL } from "@/lib/utils"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.email !== ADMIN_EMAIL) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const coupons = await db.coupon.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(coupons)
  } catch (error) {
    console.error("[COUPONS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.email !== ADMIN_EMAIL) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { code, type } = body

    if (!code || !type) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const existingCoupon = await db.coupon.findUnique({
      where: {
        code,
      },
    })

    if (existingCoupon) {
      return new NextResponse("Coupon code already exists", { status: 400 })
    }

    const coupon = await db.coupon.create({
      data: {
        code,
        type,
        status: "active",
      },
    })

    // Log action
    await db.auditLog.create({
      data: {
        userId: session.user.id, // Admin ID
        action: "CREATE_COUPON",
        details: `Created coupon ${code} (${type})`,
      },
    })

    return NextResponse.json(coupon)
  } catch (error) {
    console.error("[COUPONS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.email !== ADMIN_EMAIL) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return new NextResponse("Missing id", { status: 400 })
    }

    const coupon = await db.coupon.delete({
      where: {
        id,
      },
    })

    // Log action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_COUPON",
        details: `Deleted coupon ${coupon.code}`,
      },
    })

    return NextResponse.json(coupon)
  } catch (error) {
    console.error("[COUPONS_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
