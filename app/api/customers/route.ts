import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

// GET /api/customers - List all customers for the company
export async function GET() {
  try {
    const companyId = await getCompanyId()

    if (!companyId) {
      return NextResponse.json({ error: "No company associated" }, { status: 400 })
    }

    const customers = await db.customer.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error("Error in GET /api/customers:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const companyId = await getCompanyId()

    const body = await request.json()
    const { name, email, phone, creditLimit } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const customer = await db.customer.create({
      data: {
        companyId,
        name,
        email,
        phone,
        creditLimit: creditLimit ? Number.parseFloat(creditLimit) : null,
        currentDebt: 0,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
