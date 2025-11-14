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
    return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const companyId = await getCompanyId()
    const body = await request.json()

    const updateData: any = {}
    
    if (body.logoUrl !== undefined) {
      updateData.logoUrl = body.logoUrl
    }
    
    if (body.name !== undefined) {
      updateData.name = body.name
    }
    
    if (body.cuit !== undefined) {
      updateData.cuit = body.cuit
    }

    const company = await db.company.update({
      where: { id: companyId },
      data: updateData,
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error("[v0] Error updating settings:", error)
    return NextResponse.json({ error: "Error al actualizar configuración" }, { status: 500 })
  }
}
