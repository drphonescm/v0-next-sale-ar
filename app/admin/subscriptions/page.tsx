import { db } from "@/lib/db"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const dynamic = 'force-dynamic'

export default async function AdminSubscriptionsPage() {
  const subscriptions = await db.subscription.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  // </CHANGE>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Suscripciones</h2>
      <p className="text-muted-foreground">Gestión de suscripciones de usuarios.</p>
      
      <div className="border rounded-md">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Usuario</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Plan</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Inicio</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fin</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Método</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center text-muted-foreground">
                    No hay suscripciones registradas.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span className="font-medium">{sub.user.name || "Sin nombre"}</span>
                        <span className="text-xs text-muted-foreground">{sub.user.email}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      {sub.plan === "MONTHLY" ? "Mensual" : "Anual"}
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${
                        sub.status === 'active' ? 'bg-green-100 text-green-800' :
                        sub.status === 'grace' ? 'bg-yellow-100 text-yellow-800' :
                        sub.status === 'blocked' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {sub.status === 'active' ? 'Activa' :
                         sub.status === 'grace' ? 'Gracia' :
                         sub.status === 'blocked' ? 'Bloqueada' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      {sub.startDate ? format(sub.startDate, "dd/MM/yyyy", { locale: es }) : "-"}
                    </td>
                    <td className="p-4 align-middle">
                      {sub.endDate ? format(sub.endDate, "dd/MM/yyyy", { locale: es }) : "-"}
                    </td>
                    <td className="p-4 align-middle capitalize">
                      {sub.paymentMethod || "-"}
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
