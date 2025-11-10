import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const sales = await db.sale.findMany({
      where: {
        companyId,
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
    console.error("[v0] Error in GET /api/sales:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const companyId = await getCompanyId()

    const body = await request.json()
    const { customerId, items, status = "completed" } = body

    console.log("[v0] Creating sale with data:", { customerId, itemsCount: items?.length, status })

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 })
    }

    // Validar límite de crédito si hay cliente
    if (customerId) {
      const customer = await db.customer.findUnique({
        where: { id: customerId },
      })

      if (customer && customer.creditLimit) {
        const total = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
        const newDebt = (customer.currentDebt || 0) + total

        if (newDebt > customer.creditLimit) {
          return NextResponse.json(
            {
              error: `El cliente ha superado su límite de crédito. Límite: $${customer.creditLimit}, Deuda actual: $${customer.currentDebt || 0}`,
            },
            { status: 400 },
          )
        }

        await db.customer.update({
          where: { id: customerId },
          data: { currentDebt: newDebt },
        })
      }
    }

    // Calcular total
    let total = 0
    for (const item of items) {
      total += item.price * item.quantity
    }

    // Generar número interno
    const lastSale = await db.sale.findFirst({
      where: { companyId },
      orderBy: { internalNumber: "desc" },
    })
    const internalNumber = (lastSale?.internalNumber || 0) + 1

    console.log("[v0] Creating sale with internal number:", internalNumber)

    // Preparar items con nombres de productos
    const itemsWithNames = await Promise.all(
      items.map(async (item: any) => {
        let productName = item.productName

        // Si tiene productId pero no productName, buscar el nombre del producto
        if (item.productId && !productName) {
          const product = await db.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          })
          productName = product?.name || "Producto eliminado"
        }

        // Si no tiene ninguno de los dos, usar nombre por defecto
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

    // Crear la venta con todos los items
    const sale = await db.sale.create({
      data: {
        companyId,
        customerId,
        total,
        status,
        internalNumber,
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
