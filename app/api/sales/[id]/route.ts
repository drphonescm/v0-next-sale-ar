import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId()
    const { id } = await params

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
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    return NextResponse.json(sale)
  } catch (error) {
    console.error("Error in GET /api/sales/[id]:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId()
    const { id } = await params
    const body = await request.json()

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

    return NextResponse.json(updatedSale)
  } catch (error) {
    console.error("Error updating sale:", error)
    return NextResponse.json({ error: "Failed to update sale" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId()
    const { id } = await params

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
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

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
        } catch (error) {
          console.log("Product not found, skipping stock restore:", item.productId)
        }
      }
    }

    await db.sale.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: companyId, // Idealmente sería el userId
        status: "canceled",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting sale:", error)
    return NextResponse.json({ error: "Failed to delete sale" }, { status: 500 })
  }
}
