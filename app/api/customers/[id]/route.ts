import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

// GET /api/customers/[id] - Get a single customer
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId()
    const { id } = params

    const customer = await db.customer.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        sales: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// PUT /api/customers/[id] - Update a customer
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId()
    const { id } = params
    const body = await request.json()

    const { name, email, phone } = body

    const oldCustomer = await db.customer.findFirst({
      where: { id, companyId },
    })

    if (!oldCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const updatedCustomer = await db.customer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
      },
    })

    await db.auditLog.create({
      data: {
        companyId,
        action: "UPDATE_CUSTOMER",
        entityType: "Customer",
        entityId: id,
        entityName: updatedCustomer.name,
        oldValues: JSON.stringify({ name: oldCustomer.name, email: oldCustomer.email, phone: oldCustomer.phone }),
        newValues: JSON.stringify({
          name: updatedCustomer.name,
          email: updatedCustomer.email,
          phone: updatedCustomer.phone,
        }),
      },
    })

    return NextResponse.json(updatedCustomer)
  } catch (error) {
    console.error("[v0] Error updating customer:", error)
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}

// DELETE /api/customers/[id] - Delete a customer
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId()
    const { id } = params

    const customer = await db.customer.findFirst({
      where: { id, companyId },
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    await db.customer.delete({
      where: { id },
    })

    await db.auditLog.create({
      data: {
        companyId,
        action: "DELETE_CUSTOMER",
        entityType: "Customer",
        entityId: id,
        entityName: customer.name,
        oldValues: JSON.stringify({ name: customer.name, email: customer.email, phone: customer.phone }),
        newValues: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting customer:", error)
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}
