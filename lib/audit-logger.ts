import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

export type AuditAction =
  | "DELETE_PRODUCT"
  | "UPDATE_PRODUCT_PRICE"
  | "UPDATE_PRODUCT_STOCK"
  | "CREATE_SALE"
  | "DELETE_SALE"
  | "DELETE_CUSTOMER"
  | "UPDATE_CUSTOMER_CREDIT"
  | "CREATE_CASH_MOVEMENT"
  | "DELETE_CASH_MOVEMENT"
  | "UPDATE_COMPANY_SETTINGS"

export type EntityType = "Product" | "Sale" | "Customer" | "CashMovement" | "Company"

interface AuditLogParams {
  companyId: string
  userId?: string | null
  action: AuditAction
  entityType: EntityType
  entityId: string
  description: string
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    await prisma.auditLog.create({
      data: {
        companyId: params.companyId,
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        ipAddress,
        userAgent,
      },
    })

    console.log("[v0] Audit log created:", params.action, params.description)
  } catch (error) {
    console.error("[v0] Error creating audit log:", error)
    // No lanzamos error para no interrumpir la operación principal
  }
}
