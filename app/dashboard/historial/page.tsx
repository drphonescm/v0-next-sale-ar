"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { HistoryIcon, FilterIcon } from 'lucide-react'
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "sonner"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const moduleColors: Record<string, string> = {
  productos: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  ventas: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
  clientes: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
  caja: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
}

const actionColors: Record<string, string> = {
  creó: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  modificó: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  eliminó: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

export default function HistorialPage() {
  const { t } = useTranslation()
  const [selectedModule, setSelectedModule] = useState<string>("todos")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [searchUser, setSearchUser] = useState("")

  const params = new URLSearchParams()
  if (selectedModule !== "todos") params.append("module", selectedModule)
  if (startDate) params.append("startDate", startDate)
  if (endDate) params.append("endDate", endDate)
  if (searchUser) params.append("user", searchUser)

  const { data: historial, error, isLoading } = useSWR(
    `/api/historial?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh cada 30 segundos
    }
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Hace un momento"
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays === 1) return "Ayer"
    if (diffDays < 7) return `Hace ${diffDays} días`

    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleClearFilters = () => {
    setSelectedModule("todos")
    setStartDate("")
    setEndDate("")
    setSearchUser("")
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Historial de Cambios</h1>
        <p className="text-sm text-muted-foreground">
          Registro completo de todas las modificaciones realizadas en el sistema
        </p>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <FilterIcon className="size-4" />
            Filtros
          </CardTitle>
          <CardDescription className="text-xs">Filtra el historial por módulo, fecha o usuario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="module" className="text-xs">
                Módulo
              </Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger id="module" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="productos">Productos</SelectItem>
                  <SelectItem value="ventas">Ventas</SelectItem>
                  <SelectItem value="clientes">Clientes</SelectItem>
                  <SelectItem value="caja">Caja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs">
                Desde
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs">
                Hasta
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="searchUser" className="text-xs">
                Usuario
              </Label>
              <Input
                id="searchUser"
                type="text"
                placeholder="Buscar por usuario..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {(selectedModule !== "todos" || startDate || endDate || searchUser) && (
            <div className="flex justify-end">
              <Button onClick={handleClearFilters} size="sm" variant="outline" className="h-8 text-xs">
                Limpiar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <HistoryIcon className="size-4" />
            Registros de Actividad
          </CardTitle>
          <CardDescription className="text-xs">
            {isLoading
              ? "Cargando..."
              : historial?.length
                ? `${historial.length} registro${historial.length !== 1 ? "s" : ""} encontrado${historial.length !== 1 ? "s" : ""}`
                : "Sin registros"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}

          {error && (
            <div className="py-8 text-center">
              <p className="text-sm text-destructive">Error al cargar el historial</p>
            </div>
          )}

          {!isLoading && !error && historial?.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No se encontraron registros</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Intenta ajustar los filtros o verifica que haya actividad reciente
              </p>
            </div>
          )}

          {!isLoading && !error && historial?.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Fecha y Hora</TableHead>
                    <TableHead className="w-[120px]">Módulo</TableHead>
                    <TableHead className="w-[150px]">Usuario</TableHead>
                    <TableHead className="w-[120px]">Acción</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">{formatDate(log.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${moduleColors[log.module] || ""}`}>
                          {log.module.charAt(0).toUpperCase() + log.module.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{log.userName || "Sistema"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${actionColors[log.action] || ""}`}>
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[400px] truncate text-xs text-muted-foreground">
                        {log.details}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
