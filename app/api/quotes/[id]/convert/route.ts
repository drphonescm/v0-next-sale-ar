import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"
import { getNextDocumentNumber } from "@/lib/document-sequence"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const companyId = await getCompanyId()

    // Buscar el presupuesto
    const quote = await db.quote.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
        status: "pending",
      },
      include: {
        items: true,
      },
    })

    if (!quote) {
      return NextResponse.json({ error: "Presupuesto no encontrado o ya convertido" }, { status: 404 })
    }

    // Generar número de venta
    const saleDocumentNumber = await getNextDocumentNumber(companyId, "SALE")
    const lastSale = await db.sale.findFirst({
      where: { companyId },
      orderBy: { internalNumber: "desc" },
    })
    const internalNumber = (lastSale?.internalNumber || 0) + 1

    // Crear venta desde presupuesto
    const sale = await db.sale.create({
      data: {
        companyId,
        customerId: quote.customerId,
        total: quote.total,
        status: "completed",
        internalNumber,
        documentNumber: saleDocumentNumber,
        quoteId: quote.id,
        items: {
          create: quote.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: true,
        customer: true,
      },
    })

    // Actualizar stock de productos
    for (const item of quote.items) {
      if (item.productId) {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
      }
    }

    // Marcar presupuesto como convertido
    await db.quote.update({
      where: { id },
      data: {
        status: "converted",
      },
    })

    return NextResponse.json({
      success: true,
      sale,
      quote: {
        ...quote,
        status: "converted",
      },
    })
  } catch (error) {
    console.error("Error converting quote to sale:", error)
    return NextResponse.json({ error: "Error al convertir presupuesto" }, { status: 500 })
  }
}
