import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET /api/eliminados/cash - iniciando")
    const companyId = await getCompanyId()
    console.log("[v0] Historial cash - companyId:", companyId)
    
    const movements = await db.cashMovement.findMany({
      where: {
        companyId,
        deletedAt: {
          not: null,
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
    })

    console.log("[v0] Historial cash - encontrados:", movements.length)
    console.log("[v0] Historial cash - primeros 3:", JSON.stringify(movements.slice(0, 3).map(m => ({ id: m.id, deletedAt: m.deletedAt, type: m.type, amount: m.amount }))))

    return NextResponse.json(movements)
  } catch (error) {
    console.error("[v0] Error obteniendo movimientos eliminados:", error)
    return NextResponse.json(
      { error: "Error al obtener movimientos eliminados" },
      { status: 500 }
    )
  }
}
