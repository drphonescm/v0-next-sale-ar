import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireAuth } from "@/lib/session"

export async function GET() {
  try {
    const user = await requireAuth()
    const companyId = (user as any)?.companyId

    // Si el usuario no tiene empresa asociada, devolvemos valores vacíos
    if (!companyId) {
      return NextResponse.json({
        productsCount: 0,
        customersCount: 0,
        salesCount: 0,
        cashBalance: 0,
        totalRevenue: 0,
        recentSales: [],
        lowStockProducts: [],
      })
    }

    // Consultas simultáneas
    const [productsCount, customersCount, salesCount, cashMovements, totalRevenue, recentSales, lowStockProducts] =
      await Promise.all([
        prisma.product.count({ where: { companyId } }),
        prisma.customer.count({ where: { companyId } }),
        prisma.sale.count({ where: { companyId } }),
        prisma.cashMovement.findMany({ where: { companyId } }),
        prisma.sale.aggregate({
          where: { companyId, status: "completed" },
          _sum: { total: true },
        }),
        prisma.sale.findMany({
          where: { companyId },
          include: { customer: true, items: { include: { product: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.product.findMany({
          where: { companyId, stock: { lte: 10 } },
          orderBy: { stock: "asc" },
          take: 5,
        }),
      ])

    // Calcular balance de caja
    const cashBalance = cashMovements.reduce((acc, movement) => {
      return movement.type === "in" ? acc + movement.amount : acc - movement.amount
    }, 0)

    // Respuesta final
    return NextResponse.json({
      productsCount,
      customersCount,
      salesCount,
      cashBalance,
      totalRevenue: totalRevenue._sum.total || 0,
      recentSales: recentSales || [],
      lowStockProducts: lowStockProducts || [],
    })
  } catch (error) {
    console.error("[DashboardStatsError]", error)

    // En caso de error general, devolvemos datos vacíos para no romper el frontend
    return NextResponse.json({
      productsCount: 0,
      customersCount: 0,
      salesCount: 0,
      cashBalance: 0,
      totalRevenue: 0,
      recentSales: [],
      lowStockProducts: [],
      error: "Error al obtener estadísticas",
    })
  }
}
