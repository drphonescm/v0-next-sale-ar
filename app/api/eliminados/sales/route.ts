import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const sales = await prisma.sale.findMany({
      where: {
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
