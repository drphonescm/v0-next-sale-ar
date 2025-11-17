import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("[v0] GET /api/sales/[id] - iniciando")
    const companyId = await getCompanyId()
    const { id } = await params
    console.log("[v0] GET sale - id:", id, "companyId:", companyId)

    const sale = await db.sale.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!sale) {
      console.log("[v0] GET sale - no encontrada")
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    console.log("[v0] GET sale - éxito")
    return NextResponse.json(sale)
  } catch (error) {
    console.error("[v0] Error in GET /api/sales/[id]:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("[v0] PUT /api/sales/[id] - iniciando")
    const companyId = await getCompanyId()
    const { id } = await params
    const body = await request.json()
    console.log("[v0] PUT sale - id:", id, "companyId:", companyId, "body:", body)

    const { status } = body

    const sale = await db.sale.updateMany({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      data: {
        ...(status !== undefined && { status }),
      },
    })

    if (sale.count === 0) {
      console.log("[v0] PUT sale - no encontrada")
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    const updatedSale = await db.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    console.log("[v0] PUT sale - éxito")
    return NextResponse.json(updatedSale)
  } catch (error) {
    console.error("[v0] Error updating sale:", error)
    return NextResponse.json({ error: "Failed to update sale" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("[v0] DELETE /api/sales/[id] - iniciando")
    const companyId = await getCompanyId()
    const { id } = await params
    console.log("[v0] DELETE sale - id:", id, "companyId:", companyId)

    const sale = await db.sale.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        items: true,
      },
    })

    if (!sale) {
      console.log("[v0] DELETE sale - no encontrada")
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    console.log("[v0] DELETE sale - restaurando stock de items:", sale.items.length)
    for (const item of sale.items) {
      if (item.productId) {
        try {
          await db.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          })
          console.log("[v0] Stock restaurado para producto:", item.productId, "cantidad:", item.quantity)
        } catch (error) {
          console.log("[v0] Producto no encontrado, omitiendo restauración de stock:", item.productId)
        }
      }
    }

    await db.sale.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })

    console.log("[v0] DELETE sale - éxito")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting sale:", error)
    return NextResponse.json({ error: "Failed to delete sale" }, { status: 500 })
  }
}
