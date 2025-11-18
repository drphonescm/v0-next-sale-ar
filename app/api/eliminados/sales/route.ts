import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET /api/eliminados/sales - iniciando")
    const companyId = await getCompanyId()
    console.log("[v0] Historial sales - companyId:", companyId)
    
    const sales = await db.sale.findMany({
      where: {
        companyId,
        deletedAt: {
          not: null,
        },
      },
      include: {
        customer: true,
      },
      orderBy: {
        deletedAt: "desc",
      },
    })

    console.log("[v0] Historial sales - encontradas:", sales.length)
    console.log("[v0] Historial sales - primeras 3:", JSON.stringify(sales.slice(0, 3).map(s => ({ id: s.id, deletedAt: s.deletedAt, total: s.total }))))

    return NextResponse.json(sales)
  } catch (error) {
    console.error("[v0] Error obteniendo ventas eliminadas:", error)
    return NextResponse.json(
      { error: "Error al obtener ventas eliminadas" },
      { status: 500 }
    )
  }
}
