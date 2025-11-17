import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const movement = await prisma.cashMovement.update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: null,
      },
    })

    return NextResponse.json(movement)
  } catch (error) {
    console.error("Error restaurando movimiento:", error)
    return NextResponse.json(
      { error: "Error al restaurar movimiento" },
      { status: 500 }
    )
  }
}
