import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCompanyId } from "@/lib/session"
import { getNextDocumentNumber } from "@/lib/document-sequence"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const companyId = await getCompanyId()
    const { amount, note } = await request.json()

    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validar que el monto sea positivo
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 })
    }

    // Verificar que el cliente pertenece a la empresa
    const customer = await sql`
      SELECT * FROM "Customer"
      WHERE id = ${id} AND "companyId" = ${companyId}
    `

    if (customer.length === 0) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const currentDebt = customer[0].currentDebt || 0

    // Validar que el monto no exceda la deuda
    if (amount > currentDebt) {
      return NextResponse.json({ error: "El monto no puede ser mayor a la deuda actual" }, { status: 400 })
    }

    // Actualizar la deuda del cliente
    const newDebt = currentDebt - amount
    await sql`
      UPDATE "Customer"
      SET "currentDebt" = ${newDebt}
      WHERE id = ${id}
    `

    const documentNumber = await getNextDocumentNumber(companyId, "PAYMENT")

    await sql`
      INSERT INTO "CashMovement" (
        id,
        "companyId",
        type,
        amount,
        note,
        "documentNumber",
        "createdAt"
      ) VALUES (
        gen_random_uuid()::text,
        ${companyId},
        'in',
        ${amount},
        ${note || `Pago de cuenta corriente - ${customer[0].name}`},
        ${documentNumber},
        NOW()
      )
    `

    return NextResponse.json({
      success: true,
      newDebt,
      payment: {
        amount,
        note,
        documentNumber,
        customerName: customer[0].name,
        date: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error registering payment:", error)
    return NextResponse.json({ error: "Error al registrar el pago" }, { status: 500 })
  }
}
