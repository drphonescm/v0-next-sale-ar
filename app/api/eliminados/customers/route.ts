import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId()
    
    const customers = await db.customer.findMany({
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

    return NextResponse.json(customers)
  } catch (error) {
    console.error("Error obteniendo clientes eliminados:", error)
    return NextResponse.json(
      { error: "Error al obtener clientes eliminados" },
      { status: 500 }
    )
  }
}
