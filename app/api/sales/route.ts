import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"
import { getNextDocumentNumber } from "@/lib/document-sequence"

export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const sales = await db.sale.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(status && { status }),
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error("Error in GET /api/sales:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const companyId = await getCompanyId()

    const body = await request.json()
    const { customerId, items, status = "completed", paymentMethod = "efectivo", saleCondition = "contado" } = body

    console.log("[v0] Creating sale with data:", { customerId, itemsCount: items?.length, status, saleCondition })

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 })
    }

    // Calcular total
    let total = 0
    for (const item of items) {
      total += item.price * item.quantity
    }

    let finalCustomerId = customerId

    if (!finalCustomerId) {
      // Buscar "Consumidor Final" en la base de datos directamente
      let consumidorFinal = await db.customer.findFirst({
        where: {
          companyId,
          name: "Consumidor Final",
        },
      })

      // Si no existe, crearlo
      if (!consumidorFinal) {
        consumidorFinal = await db.customer.create({
          data: {
            companyId,
            name: "Consumidor Final",
            email: null,
            phone: null,
          },
        })
      }

      finalCustomerId = consumidorFinal?.id || null
    }

    // Obtener números de documentos
    const lastSale = await db.sale.findFirst({
      where: { companyId },
      orderBy: { internalNumber: "desc" },
    })
    const internalNumber = (lastSale?.internalNumber || 0) + 1
    const documentNumber = await getNextDocumentNumber(companyId, "SALE")

    console.log("[v0] Creating sale with numbers:", { internalNumber, documentNumber })

    // Preparar items con nombres de productos
    const itemsWithNames = await Promise.all(
      items.map(async (item: any) => {
        let productName = item.productName

        if (item.productId && !productName) {
          const product = await db.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          })
          productName = product?.name || "Producto eliminado"
        }

        if (!productName) {
          productName = "Producto manual"
        }

        return {
          productId: item.productId || null,
          productName: productName,
          quantity: item.quantity,
          price: item.price,
        }
      }),
    )

    // Crear la venta
    const sale = await db.sale.create({
      data: {
        companyId,
        customerId: finalCustomerId,
        total,
        status,
        internalNumber,
        documentNumber,
        items: {
          create: itemsWithNames,
        },
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

    console.log("[v0] Sale created successfully:", sale.id)

    if (customerId && sale.customer) {
      // Si tiene cliente Y es cuenta corriente -> sumar deuda, NO generar recibo
      if (saleCondition === "cuenta-corriente") {
        console.log("[v0] Sale on credit - updating customer debt")

        // Verificar límite de crédito
        const customer = await db.customer.findUnique({
          where: { id: customerId },
        })

        if (customer) {
          const newDebt = (customer.currentDebt || 0) + total

          if (customer.creditLimit && newDebt > customer.creditLimit) {
            // Eliminar la venta creada
            await db.sale.delete({ where: { id: sale.id } })

            return NextResponse.json(
              {
                error: `El cliente ha superado su límite de crédito. Límite: $${customer.creditLimit}, Deuda actual: $${customer.currentDebt || 0}`,
              },
              { status: 400 },
            )
          }

          // Actualizar deuda del cliente
          await db.customer.update({
            where: { id: customerId },
            data: { currentDebt: newDebt },
          })

          console.log("[v0] Customer debt updated:", { newDebt })
        }
      }
      // Si tiene cliente Y es contado -> generar recibo Y registrar en cuenta del cliente
      else if (saleCondition === "contado") {
        console.log("[v0] Sale with customer in cash - creating payment receipt")

        const receiptNumber = await getNextDocumentNumber(companyId, "PAYMENT")

        await db.payment.create({
          data: {
            companyId,
            customerId,
            amount: total,
            documentNumber: receiptNumber,
            documentType: "PAYMENT",
            note: `Pago de venta #${internalNumber} - ${paymentMethod}`,
          },
        })

        console.log("[v0] Payment receipt created:", receiptNumber)
      }
    }
    // Si NO tiene cliente (Consumidor Final) -> generar recibo de pago
    else if (!customerId || sale.customer?.name === "Consumidor Final") {
      console.log("[v0] Sale to final consumer - creating payment receipt")

      const receiptNumber = await getNextDocumentNumber(companyId, "PAYMENT")

      await db.payment.create({
        data: {
          companyId,
          customerId: finalCustomerId!,
          amount: total,
          documentNumber: receiptNumber,
          documentType: "PAYMENT",
          note: `Venta #${internalNumber} - ${paymentMethod}`,
        },
      })

      console.log("[v0] Payment receipt created for final consumer:", receiptNumber)
    }

    // Actualizar stock de productos
    for (const item of items) {
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

    console.log("[v0] Stock updated successfully")

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating sale:", error)
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 })
  }
}
