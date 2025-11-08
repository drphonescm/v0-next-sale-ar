import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET() {
  try {
    const companyId = await getCompanyId()

    const lastSale = await db.sale.findFirst({
      where: { companyId },
      orderBy: { internalNumber: "desc" },
      select: { internalNumber: true },
    })

    // El siguiente número es el último + 1, o 1 si no hay ventas
    const nextNumber = lastSale ? lastSale.internalNumber + 1 : 1

    return NextResponse.json({ number: nextNumber })
  } catch (error) {
    console.error("[v0] Error generating next sale number:", error)
    return NextResponse.json({ number: 1 })
  }
}
