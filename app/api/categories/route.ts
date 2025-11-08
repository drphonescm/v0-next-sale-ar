import { NextResponse } from "next/server"
import { getCompanyId } from "@/lib/session"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const companyId = await getCompanyId()

    const categories = await db.category.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("[v0] Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const companyId = await getCompanyId()
    const body = await request.json()

    const category = await db.category.create({
      data: {
        companyId,
        name: body.name,
        description: body.description,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("[v0] Error creating category:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
