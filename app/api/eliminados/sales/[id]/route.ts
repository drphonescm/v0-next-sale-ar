import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const sale = await prisma.sale.update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: null,
      },
    })

    return NextResponse.json(sale)
  } catch (error) {
    console.error("Error restaurando venta:", error)
    return NextResponse.json(
      { error: "Error al restaurar venta" },
      { status: 500 }
    )
  }
}
