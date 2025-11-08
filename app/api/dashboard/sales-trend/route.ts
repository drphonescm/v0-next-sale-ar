import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET() {
  try {
    const companyId = await getCompanyId()

    if (!companyId) {
      return NextResponse.json([])
    }

    // Get sales from the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const sales = await db.sale.findMany({
      where: {
        companyId,
        status: "completed",
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Group sales by day
    const salesByDay = new Map<string, number>()
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayName = days[date.getDay()]
      salesByDay.set(dayName, 0)
    }

    // Aggregate sales by day
    sales.forEach((sale) => {
      const dayName = days[sale.createdAt.getDay()]
      const currentTotal = salesByDay.get(dayName) || 0
      salesByDay.set(dayName, currentTotal + sale.total)
    })

    // Convert to array format for chart
    const chartData = Array.from(salesByDay.entries()).map(([date, ventas]) => ({
      date,
      ventas,
    }))

    return NextResponse.json(chartData)
  } catch (error) {
    console.error("[v0] Error fetching sales trend:", error)
    return NextResponse.json([])
  }
}
