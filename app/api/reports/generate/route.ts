import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { reportType, fromDate, toDate } = await req.json()
  const from = new Date(fromDate)
  const to = new Date(toDate)

  let rows = []

  if (reportType === 'ventas') {
    rows = await prisma.$queryRaw`
      SELECT DATE("createdAt") as fecha, SUM(total) as total, COUNT(id) as cantidad
      FROM "Sale"
      WHERE "createdAt" BETWEEN ${from} AND ${to}
      GROUP BY fecha
      ORDER BY fecha ASC
    `
  }

  if (reportType === 'clientes') {
    rows = await prisma.$queryRaw`
      SELECT c.name as cliente, SUM(s.total) as total_compras, COUNT(s.id) as ventas_realizadas
      FROM "Sale" s
      JOIN "Customer" c ON c.id = s."customerId"
      WHERE s."createdAt" BETWEEN ${from} AND ${to}
      GROUP BY c.id, c.name
      ORDER BY total_compras DESC
    `
  }

  if (reportType === 'caja') {
    rows = await prisma.$queryRaw`
      SELECT DATE("createdAt") as fecha, SUM(ingresos) as total_ingresos, SUM(egresos) as total_egresos
      FROM "CashMovement"
      WHERE "createdAt" BETWEEN ${from} AND ${to}
      GROUP BY fecha
      ORDER BY fecha ASC
    `
  }

  return NextResponse.json({ rows })
}
