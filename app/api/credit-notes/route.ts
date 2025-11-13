import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId()

    const creditNotes = await db.creditNote.findMany({
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

    return NextResponse.json(creditNotes)
  } catch (error) {
    console.error("Error fetching credit notes:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
