import { NextResponse } from "next/server"
import { getCompanyId } from "@/lib/session"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const companyId = await getCompanyId()

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { logoUrl: true, name: true, cuit: true, address: true },
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error("[v0] Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const companyId = await getCompanyId()
    const body = await request.json()

    const company = await db.company.update({
      where: { id: companyId },
      data: {
        logoUrl: body.logoUrl,
      },
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error("[v0] Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
