import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId()
    
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const whereClause: any = {
      companyId,
      deletedAt: {
        not: null,
      },
    }

    if (startDate && endDate) {
      whereClause.deletedAt = {
        ...whereClause.deletedAt,
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }
    
    const products = await db.product.findMany({
      where: whereClause,
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
