import { NextResponse } from "next/server"
import { getCompanyId } from "@/lib/session"
import { db } from "@/lib/db"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId()
    const body = await request.json()

    const category = await db.category.update({
      where: {
        id: params.id,
        companyId,
      },
      data: {
        name: body.name,
        description: body.description,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("[v0] Error updating category:", error)
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId()

    await db.category.delete({
      where: {
        id: params.id,
        companyId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting category:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
