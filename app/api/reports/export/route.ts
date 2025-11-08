export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { db } from "@/lib/db"
import * as XLSX from "xlsx"

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

    const companyId = (session.user as any).companyId

    let data: any[] = []
    let filename = "reporte.xlsx"
    let sheetName = "Reporte"

    // Construir filtro de fechas
    const dateFilter =
      startDate && endDate
        ? {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {}

    switch (reportType) {
      case "sales":
        const sales = await db.sale.findMany({
          where: {
            companyId,
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

        data = sales.map((sale) => ({
          Número: sale.internalNumber,
          Fecha: new Date(sale.createdAt).toLocaleDateString("es-AR"),
          Cliente: sale.customer?.name || "Cliente ocasional",
          Estado: sale.status,
          Total: `$${sale.total.toFixed(2)}`,
          Productos: sale.items
            .map((item) => {
              const productName = item.product?.name || item.productName || "Producto sin nombre"
              return `${productName} (x${item.quantity})`
            })
            .join(", "),
        }))

        filename = `ventas_${new Date().toISOString().split("T")[0]}.xlsx`
        sheetName = "Ventas"
        break

      case "customers":
        const customers = await db.customer.findMany({
          where: {
            companyId,
            ...dateFilter,
          },
          include: {
            sales: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        })

        data = customers.map((customer) => ({
          Nombre: customer.name,
          Email: customer.email || "Sin email",
          Teléfono: customer.phone || "Sin teléfono",
          "Fecha Registro": new Date(customer.createdAt).toLocaleDateString("es-AR"),
          "Total Compras": customer.sales.length,
          "Monto Total": `$${customer.sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}`,
        }))

        filename = `clientes_${new Date().toISOString().split("T")[0]}.xlsx`
        sheetName = "Clientes"
        break

      case "products":
        const products = await db.product.findMany({
          where: {
            companyId,
            ...dateFilter,
          },
          include: {
            saleItems: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        })

        data = products.map((product) => ({
          SKU: product.sku || "Sin SKU",
          Nombre: product.name,
          Precio: `$${product.price.toFixed(2)}`,
          Stock: product.stock,
          Estado: product.stock > 10 ? "En Stock" : product.stock > 0 ? "Stock Bajo" : "Sin Stock",
          "Unidades Vendidas": product.saleItems.reduce((sum, item) => sum + item.quantity, 0),
          "Fecha Creación": new Date(product.createdAt).toLocaleDateString("es-AR"),
        }))

        filename = `productos_${new Date().toISOString().split("T")[0]}.xlsx`
        sheetName = "Productos"
        break

      case "cash":
        const movements = await db.cashMovement.findMany({
          where: {
            companyId,
            ...dateFilter,
          },
          orderBy: {
            createdAt: "desc",
          },
        })

        data = movements.map((movement) => ({
          Fecha: new Date(movement.createdAt).toLocaleDateString("es-AR"),
          Tipo: movement.type === "ingreso" ? "Ingreso" : "Egreso",
          Monto: `$${movement.amount.toFixed(2)}`,
          Nota: movement.note || "Sin nota",
        }))

        filename = `caja_${new Date().toISOString().split("T")[0]}.xlsx`
        sheetName = "Movimientos de Caja"
        break

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    if (data.length === 0) {
      return NextResponse.json({ error: "No data found for the selected criteria" }, { status: 404 })
    }

    // Crear el libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // Generar el buffer del archivo Excel
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Retornar el archivo
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error generating Excel report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
