"use client"

import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PackageIcon, UsersIcon, ShoppingCartIcon, AlertTriangleIcon } from 'lucide-react'
import { useTranslation } from "@/hooks/use-translation"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardPage() {
  const { data: stats, error } = useSWR("/api/dashboard/stats", fetcher)
  const { data: salesTrendData } = useSWR("/api/dashboard/sales-trend", fetcher)
  const { t } = useTranslation()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date))
  }

  const salesChartData = salesTrendData || []

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">{t("failedToLoadDashboard")}</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t("loadingDashboard")}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Stats Cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-sm font-medium">{t("totalProducts")}</CardTitle>
            <PackageIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl font-bold">{stats.productsCount}</div>
            <p className="text-xs text-muted-foreground">{t("activeProductsInInventory")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-sm font-medium">{t("totalCustomers")}</CardTitle>
            <UsersIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl font-bold">{stats.customersCount}</div>
            <p className="text-xs text-muted-foreground">{t("registeredCustomers")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-sm font-medium">{t("totalSales")}</CardTitle>
            <ShoppingCartIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl font-bold">{stats.salesCount}</div>
            <p className="text-xs text-muted-foreground">{t("completedTransactions")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("salesTrend")}</CardTitle>
          <CardDescription className="text-xs">{t("salesTrendDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {salesChartData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
              {t("noSalesDataToShow")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                />
                <Line type="monotone" dataKey="ventas" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Recent Sales */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("recentSales")}</CardTitle>
            <CardDescription className="text-xs">{t("latestSalesTransactions")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {stats.recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noSalesYet")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("orderNumber")}</TableHead>
                    <TableHead>{t("customer")}</TableHead>
                    <TableHead>{t("total")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentSales.map((sale: any) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">#{sale.internalNumber}</TableCell>
                      <TableCell>{sale.customer?.name || t("walkIn")}</TableCell>
                      <TableCell>{formatCurrency(sale.total)}</TableCell>
                      <TableCell>
                        <Badge variant={sale.status === "completed" ? "default" : "secondary"}>
                          {sale.status === "completed" ? t("completed") : t("pending")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangleIcon className="size-4 text-destructive" />
              {t("lowStockAlert")}
            </CardTitle>
            <CardDescription className="text-xs">{t("productsWithLowStock")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {stats.lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("allProductsWellStocked")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("product")}</TableHead>
                    <TableHead>{t("sku")}</TableHead>
                    <TableHead>{t("stock")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.lowStockProducts.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={product.stock === 0 ? "destructive" : "secondary"}>{product.stock}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
