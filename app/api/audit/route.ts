import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId()

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const action = searchParams.get("action")
    const entityType = searchParams.get("entityType")
    const userId = searchParams.get("userId")

    console.log("[v0] Fetching audit logs for company:", companyId)
    console.log("[v0] Filters:", { startDate, endDate, action, entityType, userId })

    const where: any = {
      companyId,
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (action && action !== "all") {
      where.action = action
    }

    if (entityType && entityType !== "all") {
      where.entityType = entityType
    }

    if (userId && userId !== "all") {
      where.userId = userId
    }

    const logs = await db.auditLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: 500,
    })

    console.log("[v0] Found audit logs:", logs.length)

    // Formatear los logs para la UI
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      date: new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(log.createdAt),
      action: log.action,
      entityType: log.entityType,
      description: log.description,
      userId: log.userId || "Sistema",
      ipAddress: log.ipAddress || "N/A",
    }))

    return NextResponse.json(formattedLogs)
  } catch (error) {
    console.error("[v0] Error fetching audit logs:", error)
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }
}
