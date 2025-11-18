import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId()
    
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

    return NextResponse.json(sales)
  } catch (error) {
    console.error("Error obteniendo ventas eliminadas:", error)
    return NextResponse.json(
      { error: "Error al obtener ventas eliminadas" },
      { status: 500 }
    )
  }
}
