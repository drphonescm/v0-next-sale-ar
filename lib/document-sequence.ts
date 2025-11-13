import { db } from "@/lib/db"

export type DocumentType = "SALE" | "PAYMENT" | "CASH_IN" | "CASH_OUT" | "CREDIT_NOTE" | "DEBIT_NOTE" | "QUOTE"

/**
 * Obtiene el siguiente número correlativo para un tipo de documento
 * Esta función es atómica y thread-safe
 */
export async function getNextDocumentNumber(companyId: string, documentType: DocumentType): Promise<string> {
  try {
    // Buscar o crear la secuencia
    let sequence = await db.documentSequence.findUnique({
      where: {
        companyId_documentType: {
          companyId,
          documentType,
        },
      },
    })

    if (!sequence) {
      // Crear secuencia con prefijo por defecto según el tipo
      const prefixes: Record<DocumentType, string> = {
        SALE: "VTA-",
        PAYMENT: "RBO-",
        CASH_IN: "ING-",
        CASH_OUT: "EGR-",
        CREDIT_NOTE: "NC-",
        DEBIT_NOTE: "ND-",
        QUOTE: "PRES-",
      }

      sequence = await db.documentSequence.create({
        data: {
          companyId,
          documentType,
          prefix: prefixes[documentType],
          currentNumber: 0,
        },
      })
    }

    // Incrementar el número de forma atómica
    const updated = await db.documentSequence.update({
      where: { id: sequence.id },
      data: {
        currentNumber: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    })

    // Formatear el número con ceros a la izquierda (6 dígitos)
    const formattedNumber = updated.currentNumber.toString().padStart(6, "0")
    const documentNumber = `${updated.prefix || ""}${formattedNumber}`

    return documentNumber
  } catch (error) {
    console.error("Error generating document number:", error)
    throw new Error("Failed to generate document number")
  }
}

/**
 * Obtiene el último número correlativo usado para un tipo de documento
 */
export async function getCurrentDocumentNumber(companyId: string, documentType: DocumentType): Promise<string | null> {
  try {
    const sequence = await db.documentSequence.findUnique({
      where: {
        companyId_documentType: {
          companyId,
          documentType,
        },
      },
    })

    if (!sequence || sequence.currentNumber === 0) {
      return null
    }

    const formattedNumber = sequence.currentNumber.toString().padStart(6, "0")
    return `${sequence.prefix || ""}${formattedNumber}`
  } catch (error) {
    console.error("Error getting current document number:", error)
    return null
  }
}
