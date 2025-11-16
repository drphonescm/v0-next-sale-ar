import { NextRequest, NextResponse } from "next/server"
import { getChangeLog } from "@/lib/change-log"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const module = searchParams.get("module")
    const recordId = searchParams.get("recordId")

    if (!module) {
      return NextResponse.json(
        { error: "El parámetro 'module' es requerido" },
        { status: 400 }
      )
    }

    const logs = await getChangeLog(module, recordId || undefined)

    return NextResponse.json(logs)
  } catch (error) {
    console.error("Error fetching change log:", error)
    return NextResponse.json(
      { error: "Error al obtener el historial" },
      { status: 500 }
    )
  }
}
