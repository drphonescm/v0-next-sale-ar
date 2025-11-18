import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId()
    
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

    return NextResponse.json(movements)
  } catch (error) {
    console.error("Error obteniendo movimientos eliminados:", error)
    return NextResponse.json(
      { error: "Error al obtener movimientos eliminados" },
      { status: 500 }
    )
  }
}
