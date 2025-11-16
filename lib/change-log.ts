import { db } from "@/lib/db"
import { getCurrentUserId } from "@/lib/session"

interface ChangeLogData {
  module: string
  tableName: string
  recordId: string
  action: "create" | "update" | "delete"
  description: string
  before?: any
  after?: any
}

export async function logChange(data: ChangeLogData) {
  try {
    const userId = await getCurrentUserId()

    await db.changeLog.create({
      data: {
        module: data.module,
        tableName: data.tableName,
        recordId: data.recordId,
        userId: userId || undefined,
        action: data.action,
        description: data.description,
        before: data.before ? JSON.stringify(data.before) : null,
        after: data.after ? JSON.stringify(data.after) : null,
      },
    })
  } catch (error) {
    // No lanzar error para que no rompa la operación principal
    console.error("[ChangeLog] Error logging change:", error)
  }
}

export async function getChangeLog(module: string, recordId?: string) {
  try {
    const where: any = { module }
    
    if (recordId) {
      where.recordId = recordId
    }

    return await db.changeLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100, // Limitar a últimos 100 registros
    })
  } catch (error) {
    console.error("[ChangeLog] Error fetching change log:", error)
    return []
  }
}
