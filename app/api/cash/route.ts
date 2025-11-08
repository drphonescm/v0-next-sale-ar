import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

// GET /api/cash - List all cash movements for the company
export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    const movements = await db.cashMovement.findMany({
      where: {
        companyId,
        ...(type && { type }),
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate balance
    const balance = movements.reduce((acc, movement) => {
      return movement.type === "in" ? acc + movement.amount : acc - movement.amount
    }, 0)

    return NextResponse.json({ movements, balance })
  } catch (error) {
    console.error("[v0] Error in GET /api/cash:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// POST /api/cash - Create a new cash movement
export async function POST(request: NextRequest) {
  try {
    const companyId = await getCompanyId()

    const body = await request.json()
    const { type, amount, note } = body

    if (!type || !amount) {
      return NextResponse.json({ error: "Type and amount are required" }, { status: 400 })
    }

    if (!["in", "out"].includes(type)) {
      return NextResponse.json({ error: "Type must be 'in' or 'out'" }, { status: 400 })
    }

    const movement = await db.cashMovement.create({
      data: {
        companyId,
        type,
        amount: Number.parseFloat(amount),
        note,
      },
    })

    return NextResponse.json(movement, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating cash movement:", error)
    return NextResponse.json({ error: "Failed to create cash movement" }, { status: 500 })
  }
}
