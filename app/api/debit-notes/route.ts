import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId()

    const debitNotes = await db.debitNote.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      include: {
        customer: true,
        sale: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(debitNotes)
  } catch (error) {
    console.error("Error fetching debit notes:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
