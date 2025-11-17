import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("[v0] GET /api/customers/[id] - iniciando")
    const companyId = await getCompanyId()
    const { id } = await params
    console.log("[v0] GET customer - id:", id, "companyId:", companyId)

    const customer = await db.customer.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        sales: {
          where: {
            deletedAt: null,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!customer) {
      console.log("[v0] GET customer - no encontrado")
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    console.log("[v0] GET customer - éxito")
    return NextResponse.json(customer)
  } catch (error) {
    console.error("[v0] Error fetching customer:", error)
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("[v0] PUT /api/customers/[id] - iniciando")
    const companyId = await getCompanyId()
    const { id } = await params
    const body = await request.json()
    console.log("[v0] PUT customer - id:", id, "companyId:", companyId, "body:", body)

    const { name, email, phone, creditLimit } = body

    const customer = await db.customer.findFirst({
      where: { id, companyId, deletedAt: null },
    })

    if (!customer) {
      console.log("[v0] PUT customer - no encontrado")
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const updatedCustomer = await db.customer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(creditLimit !== undefined && { creditLimit: Number.parseFloat(creditLimit.toString()) || 0 }),
      },
    })

    console.log("[v0] PUT customer - éxito")
    return NextResponse.json(updatedCustomer)
  } catch (error) {
    console.error("[v0] Error updating customer:", error)
    return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("[v0] DELETE /api/customers/[id] - iniciando")
    const companyId = await getCompanyId()
    const { id } = await params
    console.log("[v0] DELETE customer - id:", id, "companyId:", companyId)

    const customer = await db.customer.findFirst({
      where: { id, companyId, deletedAt: null },
    })

    if (!customer) {
      console.log("[v0] DELETE customer - no encontrado")
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    await db.customer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })

    console.log("[v0] DELETE customer - éxito")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting customer:", error)
    return NextResponse.json({ error: "Error al eliminar cliente" }, { status: 500 })
  }
}
