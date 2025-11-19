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
        subscription: true,
        company: true,
      },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    // Fetch payment history (AuditLogs related to SUBSCRIPTION_PAYMENT)
    const history = await db.auditLog.findMany({
      where: {
        userId: user.id,
        action: "SUBSCRIPTION_PAYMENT",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    })

    return NextResponse.json({
      subscription: user.subscription,
      history,
    })
  } catch (error) {
    console.error("[SUBSCRIPTION_STATUS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
