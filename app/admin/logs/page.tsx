import { db } from "@/lib/db"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage() {
  const logs = await db.auditLog.findMany({
    take: 100,
    orderBy: {
      timestamp: 'desc'
    },
    include: {
      user: {
        select: {
          email: true
        }
      }
    }
  })
  // </CHANGE>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Logs del Sistema</h2>
      <p className="text-muted-foreground">Registro de actividad y auditoría.</p>
      
      <div className="border rounded-md">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Usuario</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Acción</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Detalles</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="h-24 text-center text-muted-foreground">
                    No hay registros de actividad.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle whitespace-nowrap">
                      {format(log.timestamp, "dd/MM/yyyy HH:mm", { locale: es })}
                    </td>
                    <td className="p-4 align-middle">
                      {log.user.email}
                    </td>
                    <td className="p-4 align-middle font-medium">
                      {log.action}
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
