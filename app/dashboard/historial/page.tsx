"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RotateCcwIcon, PackageIcon, UsersIcon, ShoppingCartIcon, WalletIcon, FilterIcon } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"

export default function DeletedItemsPage() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [deletedProducts, setDeletedProducts] = useState<any[]>([])
  const [deletedCustomers, setDeletedCustomers] = useState<any[]>([])
  const [deletedSales, setDeletedSales] = useState<any[]>([])
  const [deletedCash, setDeletedCash] = useState<any[]>([])
  
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [startTime, setStartTime] = useState("00:00")
  const [endTime, setEndTime] = useState("23:59")

  useEffect(() => {
    loadDeletedItems()
  }, [])

  const loadDeletedItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate && endDate) {
        params.append("startDate", `${startDate}T${startTime}`)
        params.append("endDate", `${endDate}T${endTime}`)
      }
      const queryString = params.toString() ? `?${params.toString()}` : ""

      const [products, customers, sales, cash] = await Promise.all([
        fetch(`/api/eliminados/products${queryString}`).then((r) => r.json()),
        fetch(`/api/eliminados/customers${queryString}`).then((r) => r.json()),
        fetch(`/api/eliminados/sales${queryString}`).then((r) => r.json()),
        fetch(`/api/eliminados/cash${queryString}`).then((r) => r.json()),
      ])

      setDeletedProducts(products || [])
      setDeletedCustomers(customers || [])
      setDeletedSales(sales || [])
      setDeletedCash(cash || [])
    } catch (error) {
      console.error("Error cargando eliminados:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los elementos eliminados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (type: string, id: number) => {
    try {
      const response = await fetch(`/api/eliminados/${type}/${id}`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Error al restaurar")

      toast({
        title: "Éxito",
        description: "Elemento restaurado correctamente",
      })

      loadDeletedItems()
    } catch (error) {
      console.error("Error restaurando:", error)
      toast({
        title: "Error",
        description: "No se pudo restaurar el elemento",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Historial</h1>
        <p className="text-muted-foreground">
          Visualiza y restaura elementos que han sido eliminados
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FilterIcon className="size-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="startTime" className="text-xs">Hora Inicio</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endTime" className="text-xs">Hora Fin</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={loadDeletedItems} 
              size="sm" 
              className="h-9"
              disabled={loading}
            >
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">
            <PackageIcon className="mr-2 size-4" />
            Productos ({deletedProducts.length})
          </TabsTrigger>
          <TabsTrigger value="customers">
            <UsersIcon className="mr-2 size-4" />
            Clientes ({deletedCustomers.length})
          </TabsTrigger>
          <TabsTrigger value="sales">
            <ShoppingCartIcon className="mr-2 size-4" />
            Ventas ({deletedSales.length})
          </TabsTrigger>
          <TabsTrigger value="cash">
            <WalletIcon className="mr-2 size-4" />
            Caja ({deletedCash.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Productos en Historial</CardTitle>
              <CardDescription>
                Productos que fueron eliminados del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deletedProducts.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No hay productos eliminados
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Fecha Eliminación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono">{product.sku}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>${product.price}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>
                          {new Date(product.deletedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestore("products", product.id)}
                          >
                            <RotateCcwIcon className="mr-2 size-4" />
                            Restaurar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Clientes en Historial</CardTitle>
              <CardDescription>
                Clientes que fueron eliminados del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deletedCustomers.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No hay clientes eliminados
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Fecha Eliminación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.email || "-"}</TableCell>
                        <TableCell>{customer.phone || "-"}</TableCell>
                        <TableCell>
                          {new Date(customer.deletedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestore("customers", customer.id)}
                          >
                            <RotateCcwIcon className="mr-2 size-4" />
                            Restaurar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Ventas en Historial</CardTitle>
              <CardDescription>
                Ventas que fueron eliminadas del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deletedSales.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No hay ventas eliminadas
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Fecha Venta</TableHead>
                      <TableHead>Fecha Eliminación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.saleNumber}</TableCell>
                        <TableCell>{sale.customer?.name || "Sin cliente"}</TableCell>
                        <TableCell>${sale.total}</TableCell>
                        <TableCell>
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(sale.deletedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestore("sales", sale.id)}
                          >
                            <RotateCcwIcon className="mr-2 size-4" />
                            Restaurar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash">
          <Card>
            <CardHeader>
              <CardTitle>Movimientos de Caja en Historial</CardTitle>
              <CardDescription>
                Movimientos de caja que fueron eliminados del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deletedCash.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No hay movimientos eliminados
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Fecha Movimiento</TableHead>
                      <TableHead>Fecha Eliminación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedCash.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <Badge variant={movement.type === "income" ? "default" : "destructive"}>
                            {movement.type === "income" ? "Ingreso" : "Egreso"}
                          </Badge>
                        </TableCell>
                        <TableCell>{movement.description}</TableCell>
                        <TableCell>${movement.amount}</TableCell>
                        <TableCell>
                          {new Date(movement.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(movement.deletedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestore("cash", movement.id)}
                          >
                            <RotateCcwIcon className="mr-2 size-4" />
                            Restaurar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
