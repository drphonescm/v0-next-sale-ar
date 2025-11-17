import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      where: {
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
