import { db } from "@/lib/db"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default async function AdminLogsPage() {
  const logs = await db.changeLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100, // Limit to last 100 logs
  })
  // </CHANGE>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Logs del Sistema</h2>
      <p className="text-muted-foreground">Registro de actividades y errores del sistema (Últimos 100).</p>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Módulo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Usuario ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No hay logs registrados
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                  </TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{log.module}</TableCell>
                  <TableCell className="max-w-[300px] truncate" title={log.description || ''}>
                    {log.description}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.userId}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
