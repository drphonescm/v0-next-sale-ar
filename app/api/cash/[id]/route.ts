import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId()
    const { id } = await params

    const cashMovement = await db.cashMovement.findFirst({
      where: { id, companyId, deletedAt: null },
    })

    if (!cashMovement) {
      return NextResponse.json({ error: "Cash movement not found" }, { status: 404 })
    }

    await db.cashMovement.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting cash movement:", error)
    return NextResponse.json({ error: "Failed to delete cash movement" }, { status: 500 })
  }
}
