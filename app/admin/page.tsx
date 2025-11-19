import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UsersIcon, CreditCardIcon, TicketIcon, ActivityIcon, BuildingIcon } from 'lucide-react'
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const userCount = await db.user.count()
  const companyCount = await db.company.count()
  const logCount = await db.changeLog.count()
  // </CHANGE>

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Bienvenido, Administrador</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
            <p className="text-xs text-muted-foreground">Usuarios registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas</CardTitle>
            <BuildingIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyCount}</div>
            <p className="text-xs text-muted-foreground">Empresas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupones Activos</CardTitle>
            <TicketIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Disponibles para uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logCount}</div>
            <p className="text-xs text-muted-foreground">Eventos en logs</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
