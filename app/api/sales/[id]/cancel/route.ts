import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"
import { getNextDocumentNumber } from "@/lib/document-sequence"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const companyId = await getCompanyId()
    const { reason } = await request.json()

    if (!reason) {
      return NextResponse.json({ error: "La razón de anulación es requerida" }, { status: 400 })
    }

    // Verificar que la venta existe y no está ya anulada
    const sale = await db.sale.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
        canceledAt: null,
      },
      include: {
        items: true,
        customer: true,
      },
    })

    if (!sale) {
      return NextResponse.json({ error: "Venta no encontrada o ya anulada" }, { status: 404 })
    }

    // Generar número de nota de crédito
    const creditNoteNumber = await getNextDocumentNumber(companyId, "CREDIT_NOTE")

    // Crear nota de crédito
    const creditNote = await db.creditNote.create({
      data: {
        companyId,
        customerId: sale.customerId,
        saleId: sale.id,
        amount: sale.total,
        reason,
        documentNumber: creditNoteNumber,
      },
    })

    // Marcar la venta como cancelada
    await db.sale.update({
      where: { id },
      data: {
        status: "canceled",
        canceledAt: new Date(),
        cancelReason: reason,
        cancelDocId: creditNote.id,
      },
    })

    // Restaurar stock de productos
    for (const item of sale.items) {
      if (item.productId) {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      }
    }

    // Si hay cliente, reducir su deuda
    if (sale.customerId) {
      await db.customer.update({
        where: { id: sale.customerId },
        data: {
          currentDebt: {
            decrement: sale.total,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      creditNote,
      sale: {
        ...sale,
        status: "canceled",
        canceledAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Error canceling sale:", error)
    return NextResponse.json({ error: "Error al anular la venta" }, { status: 500 })
  }
}
