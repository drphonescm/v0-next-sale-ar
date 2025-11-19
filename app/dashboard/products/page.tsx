"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, PencilIcon, TrashIcon, PackageIcon, DownloadIcon, SearchIcon } from 'lucide-react'
import { DeleteProductDialog } from "@/components/products/delete-product-dialog"
import { useTranslation } from "@/hooks/use-translation"
import * as XLSX from "xlsx"
import Barcode from "react-barcode"
import { ProductLabelGenerator } from "@/components/products/product-label-generator"

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch")
    return res.json()
  })

export default function ProductsPage() {
  const router = useRouter()
  const { data: products, error, mutate } = useSWR("/api/products", fetcher)
  const { data: company } = useSWR("/api/settings", fetcher)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showBarcodeFor, setShowBarcodeFor] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { t } = useTranslation()

  const filteredProducts = Array.isArray(products)
    ? products.filter((product: any) => {
        if (!searchQuery) return true // Mostrar todos si no hay búsqueda
        const query = searchQuery.toLowerCase()
        return (
          product.name.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query) ||
          product.price.toString().includes(query)
        )
      })
    : []

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  const handleExportToExcel = () => {
    if (!filteredProducts || filteredProducts.length === 0) return

    const exportData = filteredProducts.map((product: any) => ({
      SKU: product.sku || "N/A",
      Nombre: product.name,
      Precio: product.price,
      Stock: product.stock,
      Estado: product.stock === 0 ? "Sin Stock" : product.stock <= 10 ? "Stock Bajo" : "En Stock",
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos")
    XLSX.writeFile(workbook, `productos_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  const handleEdit = (product: any) => {
    router.push(`/dashboard/products/${product.id}/edit`)
  }

  const handleDelete = (product: any) => {
    setSelectedProduct(product)
    setDeleteDialogOpen(true)
  }

  const handleAdd = () => {
    router.push("/dashboard/products/new")
  }

  const handleSuccess = () => {
    mutate()
    setDialogOpen(false)
    setDeleteDialogOpen(false)
    setSelectedProduct(null)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">{t("failedToLoadProducts")}</p>
      </div>
    )
  }

  if (!products || !Array.isArray(products)) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t("loadingProducts")}</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold">{t("products")}</h2>
          <p className="text-sm text-muted-foreground">{t("manageProductInventory")}</p>
        </div>
        <div className="flex gap-2">
          {filteredProducts && filteredProducts.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportToExcel}>
              <DownloadIcon className="size-4" />
              {t("exportToExcel")}
            </Button>
          )}
          <Button size="sm" onClick={handleAdd}>
            <PlusIcon className="size-4" />
            {t("addProduct")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageIcon className="size-4" />
            {t("productInventory")}
          </CardTitle>
          <CardDescription className="text-xs">{t("viewManageProducts")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="mb-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t("searchProducts")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <PackageIcon className="size-10 text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold mb-1">
                {searchQuery ? t("noProductsFound") : t("noProductsYet")}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {searchQuery ? t("tryDifferentSearch") : t("addYourFirstProduct")}
              </p>
              {!searchQuery && (
                <Button size="sm" onClick={handleAdd}>
                  <PlusIcon className="size-4" />
                  {t("addProduct")}
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9">{t("sku")}</TableHead>
                  <TableHead className="h-9">{t("name")}</TableHead>
                  <TableHead className="h-9">{t("price")}</TableHead>
                  <TableHead className="h-9">{t("stock")}</TableHead>
                  <TableHead className="h-9">{t("status")}</TableHead>
                  <TableHead className="h-9">{t("barcode")}</TableHead>
                  <TableHead className="h-9 text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product: any) => (
                  <TableRow key={product.id} className="h-12">
                    <TableCell className="font-mono text-xs py-2">{product.sku || "N/A"}</TableCell>
                    <TableCell className="font-medium py-2">{product.name}</TableCell>
                    <TableCell className="py-2">{formatCurrency(product.price)}</TableCell>
                    <TableCell className="py-2">
                      <Badge
                        variant={product.stock === 0 ? "destructive" : product.stock <= 10 ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      {product.stock === 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          {t("outOfStock")}
                        </Badge>
                      ) : product.stock <= 10 ? (
                        <Badge variant="secondary" className="text-xs">
                          {t("lowStock")}
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-xs">
                          {t("inStock")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      {product.sku ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setShowBarcodeFor(showBarcodeFor === product.id ? null : product.id)}
                        >
                          {showBarcodeFor === product.id ? t("hideBarcode") : t("showBarcode")}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("noSku")}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(product)}>
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(product)}>
                          <TrashIcon className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {showBarcodeFor && filteredProducts.find((p: any) => p.id === showBarcodeFor) && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/20 flex justify-center">
              <ProductLabelGenerator 
                product={filteredProducts.find((p: any) => p.id === showBarcodeFor)} 
                company={company}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteProductDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        product={selectedProduct}
        onSuccess={handleSuccess}
      />
    </>
  )
}
