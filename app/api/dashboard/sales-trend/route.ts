import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from "date-fns"
import { es } from "date-fns/locale"

export async function GET() {
  try {
    const companyId = await getCompanyId()

    if (!companyId) {
      return NextResponse.json([])
    }

    const now = new Date()
    const start = startOfWeek(now, { weekStartsOn: 1 }) // 1 = Monday
    const end = endOfWeek(now, { weekStartsOn: 1 })

    const sales = await db.sale.findMany({
      where: {
        companyId,
        status: "completed",
        createdAt: {
          gte: start,
          lte: end,
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

    const salesByDay = new Map<string, number>()
    const daysInterval = eachDayOfInterval({ start, end })

    daysInterval.forEach((day) => {
      // Format day name (e.g., "Lun", "Mar")
      const dayName = format(day, "EEE", { locale: es })
      // Capitalize first letter
      const formattedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1)
      salesByDay.set(formattedDayName, 0)
    })

    sales.forEach((sale) => {
      const dayName = format(sale.createdAt, "EEE", { locale: es })
      const formattedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1)
      const currentTotal = salesByDay.get(formattedDayName) || 0
      salesByDay.set(formattedDayName, currentTotal + sale.total)
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
