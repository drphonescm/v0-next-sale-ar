import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"
import { createAuditLog } from "@/lib/audit-log"

// GET /api/sales/[id] - Get a single sale
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId()
    const { id } = params

    const sale = await db.sale.findFirst({
      where: {
        id,
        companyId,
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

// PUT /api/sales/[id] - Update a sale status
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId()
    const { id } = params
    const body = await request.json()

    const { status } = body

    const oldSale = await db.sale.findFirst({
      where: { id, companyId },
    })

    if (!oldSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    const sale = await db.sale.updateMany({
      where: {
        id,
        companyId,
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

    if (updatedSale) {
      await createAuditLog({
        companyId,
        action: "UPDATE",
        entityType: "Sale",
        entityId: id,
        entityName: `Venta #${updatedSale.saleNumber}`,
        oldValues: { status: oldSale.status },
        newValues: { status: updatedSale.status },
        request,
      })
    }

    return NextResponse.json(updatedSale)
  } catch (error) {
    console.error("Error updating sale:", error)
    return NextResponse.json({ error: "Failed to update sale" }, { status: 500 })
  }
}

// DELETE /api/sales/[id] - Delete a sale
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId()
    const { id } = params

    const sale = await db.sale.findFirst({
      where: {
        id,
        companyId,
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
          // Producto fue eliminado, continuar sin error
          console.log("Product not found, skipping stock restore:", item.productId)
        }
      }
    }

    await db.saleItem.deleteMany({
      where: { saleId: id },
    })

    await db.sale.delete({
      where: { id },
    })

    await createAuditLog({
      companyId,
      action: "DELETE",
      entityType: "Sale",
      entityId: id,
      entityName: `Venta #${sale.saleNumber}`,
      oldValues: {
        saleNumber: sale.saleNumber,
        customerId: sale.customerId,
        total: sale.total,
        itemCount: sale.items.length,
      },
      newValues: null,
      request,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting sale:", error)
    return NextResponse.json({ error: "Failed to delete sale" }, { status: 500 })
  }
}
