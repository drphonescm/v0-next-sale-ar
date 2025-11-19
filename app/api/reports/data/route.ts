export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const reportType = searchParams.get("type") || "sales"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const customerSort = searchParams.get("sort") || "highest"
    const categoryId = searchParams.get("categoryId")

    const companyId = (session.user as any).companyId

    console.log("[v0] Report request:", { reportType, startDate, endDate, companyId })

    let data: any[] = []

    // Construir filtro de fechas con hora
    const dateFilter =
      startDate && endDate
        ? {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {}

    console.log("[v0] Date filter:", dateFilter)

    switch (reportType) {
      case "sales":
        const sales = await db.sale.findMany({
          where: {
            companyId,
            deletedAt: null,
            ...dateFilter,
          },
          include: {
            customer: true,
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })

        console.log("[v0] Sales found:", sales.length)

        data = sales.map((sale) => ({
          number: sale.internalNumber,
          date: new Date(sale.createdAt).toLocaleString("es-AR"),
          customer: sale.customer?.name || "Cliente ocasional",
          status: sale.status,
          total: `$${sale.total.toFixed(2)}`,
          products: sale.items
            .map((item) => {
              const productName = item.product?.name || item.productName || "Producto sin nombre"
              return `${productName} (x${item.quantity})`
            })
            .join(", "),
        }))
        break

      case "customers":
        const customers = await db.customer.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          include: {
            sales: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        })

        const customersWithData = customers.map((customer) => ({
          name: customer.name,
          email: customer.email || "Sin email",
          phone: customer.phone || "Sin teléfono",
          joined: new Date(customer.createdAt).toLocaleDateString("es-AR"),
          totalSales: customer.sales.length,
          totalAmount: `$${customer.sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}`,
          debt: customer.currentDebt,
        }))

        // Ordenar según el parámetro
        if (customerSort === "highest") {
          customersWithData.sort((a, b) => b.debt - a.debt)
        } else {
          customersWithData.sort((a, b) => a.debt - b.debt)
        }

        data = customersWithData
        break

      case "products":
        const productFilter: any = {
          companyId,
          deletedAt: null,
        }

        if (categoryId && categoryId !== "all") {
          productFilter.categoryId = categoryId
        }

        const products = await db.product.findMany({
          where: productFilter,
          include: {
            saleItems: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        })

        data = products.map((product) => ({
          sku: product.sku || "Sin SKU",
          name: product.name,
          price: `$${product.price.toFixed(2)}`,
          stock: product.stock,
          status: product.stock > 10 ? "En Stock" : product.stock > 0 ? "Stock Bajo" : "Sin Stock",
          unitsSold: product.saleItems.reduce((sum, item) => sum + item.quantity, 0),
          date: new Date(product.createdAt).toLocaleDateString("es-AR"),
        }))
        break

      case "cash":
        console.log("[v0] Querying cash movements with filter:", {
          companyId,
          deletedAt: null,
          ...dateFilter,
        })

        const movements = await db.cashMovement.findMany({
          where: {
            companyId,
            deletedAt: null,
            ...dateFilter,
          },
          orderBy: {
            createdAt: "desc",
          },
        })

        console.log("[v0] Cash movements found:", movements.length)

        data = movements.map((movement) => ({
          date: new Date(movement.createdAt).toLocaleString("es-AR"),
          type: movement.type === "in" ? "Ingreso" : "Egreso",
          amount: `$${movement.amount.toFixed(2)}`,
          note: movement.note || "Sin nota",
        }))
        break

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    console.log("[v0] Report data generated:", data.length, "records")

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error generating report data:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
