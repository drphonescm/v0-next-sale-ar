import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

// DELETE /api/cash/[id] - Delete a cash movement
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId()
    const { id } = await params

    const cashMovement = await db.cashMovement.findFirst({
      where: { id, companyId },
    })

    if (!cashMovement) {
      return NextResponse.json({ error: "Cash movement not found" }, { status: 404 })
    }

    await db.cashMovement.delete({
      where: { id },
    })

    try {
      await db.auditLog.create({
        data: {
          companyId,
          userId: null,
          action: "DELETE_CASH_MOVEMENT",
          entityType: "CashMovement",
          entityId: id,
          entityName: `${cashMovement.type === "ingreso" ? "Ingreso" : "Egreso"} - $${cashMovement.amount}`,
          oldValues: JSON.stringify({ type: cashMovement.type, amount: cashMovement.amount, note: cashMovement.note }),
          newValues: null,
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      })
    } catch (auditError) {
      console.error("[v0] Error creating audit log (non-critical):", auditError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting cash movement:", error)
    return NextResponse.json({ error: "Failed to delete cash movement" }, { status: 500 })
  }
}
