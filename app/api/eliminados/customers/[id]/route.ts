import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: null,
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error("Error restaurando cliente:", error)
    return NextResponse.json(
      { error: "Error al restaurar cliente" },
      { status: 500 }
    )
  }
}
