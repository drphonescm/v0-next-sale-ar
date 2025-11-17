import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: null,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error restaurando producto:", error)
    return NextResponse.json(
      { error: "Error al restaurar producto" },
      { status: 500 }
    )
  }
}
