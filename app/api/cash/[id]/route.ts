import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

// DELETE /api/cash/[id] - Delete a cash movement
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId()
    const { id } = await params

    const result = await db.cashMovement.deleteMany({
      where: { id, companyId },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: "Cash movement not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting cash movement:", error)
    return NextResponse.json({ error: "Failed to delete cash movement" }, { status: 500 })
  }
}
