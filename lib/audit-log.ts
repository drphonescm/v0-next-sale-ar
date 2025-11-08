import { db } from "@/lib/db"

export type AuditAction = "CREATE" | "UPDATE" | "DELETE"
export type EntityType = "PRODUCT" | "CUSTOMER" | "SALE" | "CASH_MOVEMENT"

interface AuditLogParams {
  companyId: string
  userId: string
  action: AuditAction
  entityType: EntityType
  entityId: string
  entityName?: string
  oldValues?: any
  newValues?: any
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    await db.auditLog.create({
      data: {
        companyId: params.companyId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        entityName: params.entityName,
        oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
        newValues: params.newValues ? JSON.stringify(params.newValues) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    })
  } catch (error) {
    console.error("[v0] Failed to create audit log:", error)
  }
}

export async function getAuditLogs(
  companyId: string,
  filters?: {
    entityType?: EntityType
    startDate?: Date
    endDate?: Date
    limit?: number
  },
) {
  const where: any = { companyId }

  if (filters?.entityType) {
    where.entityType = filters.entityType
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

  return await db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters?.limit || 100,
  })
}
