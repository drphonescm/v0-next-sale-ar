import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const customers = await prisma.customer.findMany({
      where: {
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
