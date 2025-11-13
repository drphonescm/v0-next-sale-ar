import { db } from "@/lib/db"

export type AuditAction =
  | "CREATE_PRODUCT"
  | "UPDATE_PRODUCT"
  | "DELETE_PRODUCT"
  | "CREATE_SALE"
  | "UPDATE_SALE"
  | "DELETE_SALE"
  | "CANCEL_SALE"
  | "CREATE_CUSTOMER"
  | "UPDATE_CUSTOMER"
  | "DELETE_CUSTOMER"
  | "CREATE_PAYMENT"
  | "DELETE_PAYMENT"
  | "CREATE_CASH_IN"
  | "CREATE_CASH_OUT"
  | "DELETE_CASH_MOVEMENT"
  | "CREATE_CREDIT_NOTE"
  | "CREATE_DEBIT_NOTE"
  | "CONVERT_QUOTE"

export type EntityType =
  | "PRODUCT"
  | "CUSTOMER"
  | "SALE"
  | "CASH_MOVEMENT"
  | "PAYMENT"
  | "CREDIT_NOTE"
  | "DEBIT_NOTE"
  | "QUOTE"

interface AuditLogParams {
  companyId: string
  userId?: string | null
  action: AuditAction
  entityType: EntityType
  entityId: string
  entityName?: string
  oldValues?: any
  newValues?: any
  request?: Request
}

// Función auxiliar para extraer IP y User Agent de manera segura
function extractRequestInfo(request?: Request) {
  if (!request) {
    return { ipAddress: null, userAgent: null }
  }

  try {
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || null

    const userAgent = request.headers.get("user-agent") || null

    return { ipAddress, userAgent }
  } catch (error) {
    console.error("[AUDIT] Error extracting request info:", error)
    return { ipAddress: null, userAgent: null }
  }
}

// Función auxiliar para sanitizar valores
function sanitizeValues(values: any): string | null {
  if (!values) return null

  try {
    // Eliminar campos sensibles
    const sanitized = { ...values }
    const sensitiveFields = ["password", "passwordHash", "token", "resetToken", "apiKey"]

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = "[REDACTED]"
      }
    }

    // Limitar tamaño del JSON
    const jsonString = JSON.stringify(sanitized)
    if (jsonString.length > 10000) {
      return JSON.stringify({ _truncated: true, _size: jsonString.length })
    }

    return jsonString
  } catch (error) {
    console.error("[AUDIT] Error sanitizing values:", error)
    return null
  }
}

// Función principal de auditoría - NUNCA lanza errores
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  // Ejecutar de forma asíncrona sin bloquear
  setImmediate(async () => {
    try {
      // Validación de datos obligatorios
      if (!params.companyId || !params.action || !params.entityType || !params.entityId) {
        console.error("[AUDIT] Missing required fields:", {
          companyId: !!params.companyId,
          action: !!params.action,
          entityType: !!params.entityType,
          entityId: !!params.entityId,
        })
        return
      }

      // Extraer información del request
      const { ipAddress, userAgent } = extractRequestInfo(params.request)

      // Sanitizar valores
      const oldValuesJson = sanitizeValues(params.oldValues)
      const newValuesJson = sanitizeValues(params.newValues)

      // Crear registro de auditoría
      await db.auditLog.create({
        data: {
          companyId: params.companyId,
          userId: params.userId || null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          entityName: params.entityName || null,
          oldValues: oldValuesJson,
          newValues: newValuesJson,
          ipAddress,
          userAgent,
        },
      })
    } catch (error) {
      // Solo loguear el error, nunca propagar
      console.error("[AUDIT] Failed to create audit log (non-blocking):", error)
    }
  })
}

// Función helper para obtener userId de forma segura
export async function getSafeUserId(): Promise<string | null> {
  try {
    const { getServerSession } = await import("next-auth")
    const { authOptions } = await import("@/lib/auth")
    const session = await getServerSession(authOptions)
    return session?.user?.id || null
  } catch (error) {
    return null
  }
}

// Función para obtener logs con filtros
export async function getAuditLogs(
  companyId: string,
  filters?: {
    entityType?: EntityType
    action?: AuditAction
    startDate?: Date
    endDate?: Date
    userId?: string
    limit?: number
  },
) {
  try {
    const where: any = { companyId }

    if (filters?.entityType) {
      where.entityType = filters.entityType
    }

    if (filters?.action) {
      where.action = filters.action
    }

    if (filters?.userId) {
      where.userId = filters.userId
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 100,
    })

    return logs
  } catch (error) {
    console.error("[AUDIT] Error fetching audit logs:", error)
    return []
  }
}
