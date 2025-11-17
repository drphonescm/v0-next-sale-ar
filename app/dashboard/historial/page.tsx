"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RotateCcwIcon, PackageIcon, UsersIcon, ShoppingCartIcon, WalletIcon } from 'lucide-react'
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

  useEffect(() => {
    loadDeletedItems()
  }, [])

  const loadDeletedItems = async () => {
    setLoading(true)
    try {
      const [products, customers, sales, cash] = await Promise.all([
        fetch("/api/eliminados/products").then((r) => r.json()),
        fetch("/api/eliminados/customers").then((r) => r.json()),
        fetch("/api/eliminados/sales").then((r) => r.json()),
        fetch("/api/eliminados/cash").then((r) => r.json()),
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
        <h1 className="text-3xl font-bold">Elementos Eliminados</h1>
        <p className="text-muted-foreground">
          Visualiza y restaura elementos que han sido eliminados
        </p>
      </div>

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
              <CardTitle>Productos Eliminados</CardTitle>
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
              <CardTitle>Clientes Eliminados</CardTitle>
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
              <CardTitle>Ventas Eliminadas</CardTitle>
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
              <CardTitle>Movimientos de Caja Eliminados</CardTitle>
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
