import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId()
    
    const products = await db.product.findMany({
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

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error obteniendo productos eliminados:", error)
    return NextResponse.json(
      { error: "Error al obtener productos eliminados" },
      { status: 500 }
    )
  }
}
