import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const movements = await prisma.cashMovement.findMany({
      where: {
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
