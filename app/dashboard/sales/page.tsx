"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, EyeIcon, TrashIcon, ShoppingCartIcon, DownloadIcon, FileTextIcon, PrinterIcon } from "lucide-react"
import Link from "next/link"
import { ViewSaleDialog } from "@/components/sales/view-sale-dialog"
import { DeleteSaleDialog } from "@/components/sales/delete-sale-dialog"
import { useTranslation } from "@/hooks/use-translation"
import * as XLSX from "xlsx"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { useRouter } from "next/navigation" // Agregar router para navegación

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch")
    return res.json()
  })

export default function SalesPage() {
  const { data: sales, error, mutate } = useSWR("/api/sales", fetcher)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const { t } = useTranslation()
  const router = useRouter() // Agregar router para navegación

  const { data: companySettings } = useSWR("/api/settings", fetcher)

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

  const handleExportToExcel = () => {
    if (!sales || !Array.isArray(sales) || sales.length === 0) return

    const exportData = sales.map((sale: any) => ({
      "Número de Orden": `#${sale.internalNumber}`,
      Cliente: sale.customer?.name || "Consumidor final",
      Artículos: sale.items.length,
      Total: sale.total,
      Estado: sale.status === "completed" ? "Completado" : "Pendiente",
      Fecha: formatDate(sale.createdAt),
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas")
    XLSX.writeFile(workbook, `ventas_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  const handleGeneratePDF = async (sale: any) => {
    try {
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([595, 842]) // A4 size
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      const { width, height } = page.getSize()
      let yPos = height - 40

      const saleDate = new Date(sale.createdAt)

      // Header background
      page.drawRectangle({
        x: 0,
        y: height - 100,
        width: width,
        height: 100,
        color: rgb(0.98, 0.98, 0.99),
      })

      let logoWidth = 0
      if (companySettings?.logoUrl) {
        try {
          const logoResponse = await fetch(companySettings.logoUrl)
          const logoBytes = await logoResponse.arrayBuffer()

          let logoImage
          const contentType = logoResponse.headers.get("content-type")
          if (contentType?.includes("png")) {
            logoImage = await pdfDoc.embedPng(logoBytes)
          } else if (contentType?.includes("jpeg") || contentType?.includes("jpg")) {
            logoImage = await pdfDoc.embedJpg(logoBytes)
          } else {
            logoImage = await pdfDoc.embedPng(logoBytes)
          }

          const maxHeight = 50
          const aspectRatio = logoImage.width / logoImage.height
          const logoHeight = maxHeight
          logoWidth = maxHeight * aspectRatio

          page.drawImage(logoImage, {
            x: 40,
            y: height - 80,
            width: logoWidth,
            height: logoHeight,
          })
        } catch (error) {
          console.error("Error loading logo:", error)
        }
      }

      // Nombre de empresa al lado del logo
      page.drawText(companySettings?.name || "Next Sale", {
        x: 40 + logoWidth + 15,
        y: height - 55,
        size: 18,
        font: boldFont,
        color: rgb(0.1, 0.2, 0.4),
      })

      // Badge de factura rediseñado y mejor posicionado
      const badgeWidth = 100
      const badgeHeight = 60
      const badgeX = width - badgeWidth - 40
      const badgeY = height - 90

      // Badge background
      page.drawRectangle({
        x: badgeX,
        y: badgeY,
        width: badgeWidth,
        height: badgeHeight,
        color: rgb(0.25, 0.47, 0.75),
        borderRadius: 4,
      })

      // Texto "FACTURA"
      page.drawText("FACTURA", {
        x: badgeX + 20,
        y: badgeY + 42,
        size: 11,
        font: boldFont,
        color: rgb(1, 1, 1),
      })

      // Letra "C"
      page.drawText("C", {
        x: badgeX + 42,
        y: badgeY + 25,
        size: 18,
        font: boldFont,
        color: rgb(1, 1, 1),
      })

      // Número de factura
      const invoiceNum = `${sale.internalNumber.toString().padStart(8, "0")}`
      page.drawText(`N° ${invoiceNum}`, {
        x: badgeX + 12,
        y: badgeY + 8,
        size: 9,
        font: boldFont,
        color: rgb(1, 1, 1),
      })

      // Fecha debajo del badge
      const saleDay = saleDate.getDate().toString().padStart(2, "0")
      const saleMonth = (saleDate.getMonth() + 1).toString().padStart(2, "0")
      const saleYear = saleDate.getFullYear()

      page.drawText(`Fecha: ${saleDay}/${saleMonth}/${saleYear}`, {
        x: badgeX,
        y: badgeY - 15,
        size: 9,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })

      yPos = height - 120

      // Customer section header
      page.drawRectangle({
        x: 40,
        y: yPos - 22,
        width: width - 80,
        height: 22,
        color: rgb(0.94, 0.95, 0.97),
      })

      page.drawText("DATOS DEL CLIENTE", {
        x: 50,
        y: yPos - 15,
        size: 9,
        font: boldFont,
        color: rgb(0.2, 0.3, 0.5),
      })

      yPos -= 22

      // Customer data box
      page.drawRectangle({
        x: 40,
        y: yPos - 50,
        width: width - 80,
        height: 50,
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 1,
        color: rgb(1, 1, 1),
      })

      yPos -= 15

      // Primera fila de datos
      const customerName = sale.customer?.name || "Consumidor Final"
      page.drawText("Cliente:", {
        x: 50,
        y: yPos,
        size: 9,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      })

      page.drawText(customerName, {
        x: 100,
        y: yPos,
        size: 9,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })

      page.drawText("Condición IVA:", {
        x: 320,
        y: yPos,
        size: 9,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      })

      page.drawText(sale.customer?.ivaCondition || "Consumidor Final", {
        x: 410,
        y: yPos,
        size: 9,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })

      yPos -= 18

      // Segunda fila de datos
      page.drawText("Email:", {
        x: 50,
        y: yPos,
        size: 9,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      })

      page.drawText(sale.customer?.email || "No especificado", {
        x: 100,
        y: yPos,
        size: 9,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })

      page.drawText("Teléfono:", {
        x: 320,
        y: yPos,
        size: 9,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      })

      page.drawText(sale.customer?.phone || "No especificado", {
        x: 410,
        y: yPos,
        size: 9,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })

      yPos -= 35

      // Table header
      page.drawRectangle({
        x: 40,
        y: yPos - 20,
        width: width - 80,
        height: 20,
        color: rgb(0.25, 0.47, 0.75),
      })

      page.drawText("Código", { x: 50, y: yPos - 13, size: 9, font: boldFont, color: rgb(1, 1, 1) })
      page.drawText("Producto", { x: 130, y: yPos - 13, size: 9, font: boldFont, color: rgb(1, 1, 1) })
      page.drawText("Cant.", { x: 360, y: yPos - 13, size: 9, font: boldFont, color: rgb(1, 1, 1) })
      page.drawText("Precio Unit.", { x: 410, y: yPos - 13, size: 9, font: boldFont, color: rgb(1, 1, 1) })
      page.drawText("Importe", { x: 490, y: yPos - 13, size: 9, font: boldFont, color: rgb(1, 1, 1) })

      yPos -= 25

      // Table rows
      sale.items.forEach((item: any, index: number) => {
        if (index % 2 === 0) {
          page.drawRectangle({
            x: 40,
            y: yPos - 18,
            width: width - 80,
            height: 20,
            color: rgb(0.98, 0.98, 0.98),
          })
        }

        const itemTotal = item.price * item.quantity
        const productName = item.productName || item.product?.name || "Producto eliminado"
        const productCode = item.product?.sku || item.productCode || "-"

        page.drawText(productCode, { x: 50, y: yPos - 12, size: 9, font, color: rgb(0.2, 0.2, 0.2) })
        page.drawText(productName.substring(0, 30), { x: 130, y: yPos - 12, size: 9, font, color: rgb(0.2, 0.2, 0.2) })
        page.drawText(item.quantity.toString(), { x: 370, y: yPos - 12, size: 9, font, color: rgb(0.2, 0.2, 0.2) })
        page.drawText(`$${item.price.toFixed(2)}`, { x: 415, y: yPos - 12, size: 9, font, color: rgb(0.4, 0.4, 0.4) })
        page.drawText(`$${itemTotal.toFixed(2)}`, {
          x: 490,
          y: yPos - 12,
          size: 9,
          font: boldFont,
          color: rgb(0.1, 0.4, 0.1),
        })

        yPos -= 22
      })

      yPos = 180

      // Subtotal
      page.drawText("Subtotal:", {
        x: width - 220,
        y: yPos,
        size: 10,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.3),
      })

      page.drawText(`$${sale.total.toFixed(2)}`, {
        x: width - 130,
        y: yPos,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })

      yPos -= 25

      // Total box
      page.drawRectangle({
        x: width - 230,
        y: yPos - 12,
        width: 190,
        height: 35,
        color: rgb(0.25, 0.47, 0.75),
        borderRadius: 4,
      })

      page.drawText("TOTAL:", {
        x: width - 215,
        y: yPos,
        size: 13,
        font: boldFont,
        color: rgb(1, 1, 1),
      })

      page.drawText(`$${sale.total.toFixed(2)}`, {
        x: width - 125,
        y: yPos,
        size: 13,
        font: boldFont,
        color: rgb(1, 1, 1),
      })

      page.drawLine({
        start: { x: 40, y: 70 },
        end: { x: width - 40, y: 70 },
        thickness: 1,
        color: rgb(0.85, 0.85, 0.85),
      })

      page.drawText("Comprobante generado con Next Sale - Sistema de Gestión de Ventas", {
        x: width / 2 - 175,
        y: 50,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      })

      page.drawText("www.nextsale.com.ar", {
        x: width / 2 - 50,
        y: 35,
        size: 8,
        font,
        color: rgb(0.6, 0.6, 0.6),
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `factura_${sale.internalNumber}.pdf`
      link.click()
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Error al generar la factura. Por favor, intente nuevamente.")
    }
  }

  const handleGenerateTicket = async (sale: any) => {
    try {
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([226, 800]) // 80mm width ticket
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      const { width, height } = page.getSize()
      const centerX = width / 2
      let yPos = height - 30

      if (companySettings?.logoUrl) {
        try {
          const logoResponse = await fetch(companySettings.logoUrl)
          const logoBytes = await logoResponse.arrayBuffer()

          let logoImage
          const contentType = logoResponse.headers.get("content-type")
          if (contentType?.includes("png")) {
            logoImage = await pdfDoc.embedPng(logoBytes)
          } else if (contentType?.includes("jpeg") || contentType?.includes("jpg")) {
            logoImage = await pdfDoc.embedJpg(logoBytes)
          } else {
            logoImage = await pdfDoc.embedPng(logoBytes)
          }

          const maxHeight = 40
          const aspectRatio = logoImage.width / logoImage.height
          const logoHeight = maxHeight
          const logoWidth = maxHeight * aspectRatio

          page.drawImage(logoImage, {
            x: centerX - logoWidth / 2,
            y: yPos - logoHeight,
            width: logoWidth,
            height: logoHeight,
          })
          yPos -= logoHeight + 10
        } catch (error) {
          console.error("Error loading logo:", error)
          yPos -= 10
        }
      }

      // Company name
      const companyName = companySettings?.name || "NEXT SALE"
      const companyNameWidth = companyName.length * 6
      page.drawText(companyName, {
        x: centerX - companyNameWidth / 2,
        y: yPos,
        size: 13,
        font: boldFont,
        color: rgb(0.1, 0.2, 0.4),
      })

      yPos -= 15
      page.drawLine({
        start: { x: 10, y: yPos },
        end: { x: width - 10, y: yPos },
        thickness: 2,
        color: rgb(0.2, 0.4, 0.7),
      })

      yPos -= 20
      page.drawText(`FACTURA C`, {
        x: centerX - 30,
        y: yPos,
        size: 10,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      })

      yPos -= 15
      const invoiceNum = sale.internalNumber.toString().padStart(8, "0")
      page.drawText(`N° ${invoiceNum}`, {
        x: centerX - 35,
        y: yPos,
        size: 9,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })

      yPos -= 12
      const saleDate = new Date(sale.createdAt)
      const saleDay = saleDate.getDate().toString().padStart(2, "0")
      const saleMonth = (saleDate.getMonth() + 1).toString().padStart(2, "0")
      const saleYear = saleDate.getFullYear()
      const saleHour = saleDate.getHours().toString().padStart(2, "0")
      const saleMinute = saleDate.getMinutes().toString().padStart(2, "0")

      page.drawText(`${saleDay}/${saleMonth}/${saleYear} ${saleHour}:${saleMinute}`, {
        x: centerX - 50,
        y: yPos,
        size: 7,
        font,
        color: rgb(0.4, 0.4, 0.4),
      })

      yPos -= 15
      page.drawLine({
        start: { x: 10, y: yPos },
        end: { x: width - 10, y: yPos },
        thickness: 1,
        dashArray: [3, 3],
        color: rgb(0.7, 0.7, 0.7),
      })

      yPos -= 15
      const customerName = sale.customer?.name || "Consumidor Final"
      page.drawText("Cliente:", { x: 10, y: yPos, size: 7, font: boldFont, color: rgb(0.2, 0.2, 0.2) })
      yPos -= 10
      page.drawText(customerName.substring(0, 28), { x: 10, y: yPos, size: 7, font, color: rgb(0.3, 0.3, 0.3) })

      yPos -= 15
      page.drawLine({
        start: { x: 10, y: yPos },
        end: { x: width - 10, y: yPos },
        thickness: 1,
        dashArray: [3, 3],
        color: rgb(0.7, 0.7, 0.7),
      })

      yPos -= 15
      sale.items.forEach((item: any) => {
        const productName = item.productName || item.product?.name || "Producto eliminado"
        const itemTotal = item.price * item.quantity

        page.drawText(productName.substring(0, 28), {
          x: 10,
          y: yPos,
          size: 7,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        })
        yPos -= 10
        page.drawText(`${item.quantity} x $${item.price.toFixed(2)}`, {
          x: 10,
          y: yPos,
          size: 6,
          font,
          color: rgb(0.4, 0.4, 0.4),
        })
        page.drawText(`$${itemTotal.toFixed(2)}`, {
          x: width - 65,
          y: yPos,
          size: 7,
          font: boldFont,
          color: rgb(0.1, 0.3, 0.1),
        })
        yPos -= 13
      })

      yPos -= 8
      page.drawLine({
        start: { x: 10, y: yPos },
        end: { x: width - 10, y: yPos },
        thickness: 2,
        color: rgb(0.2, 0.4, 0.7),
      })

      yPos -= 18
      page.drawText("TOTAL:", {
        x: 10,
        y: yPos,
        size: 11,
        font: boldFont,
        color: rgb(0.1, 0.2, 0.4),
      })
      page.drawText(`$${sale.total.toFixed(2)}`, {
        x: width - 85,
        y: yPos,
        size: 11,
        font: boldFont,
        color: rgb(0.1, 0.3, 0.1),
      })

      yPos -= 20
      page.drawLine({
        start: { x: 10, y: yPos },
        end: { x: width - 10, y: yPos },
        thickness: 1,
        dashArray: [3, 3],
        color: rgb(0.7, 0.7, 0.7),
      })

      yPos -= 15
      page.drawText("¡Gracias por su compra!", {
        x: centerX - 45,
        y: yPos,
        size: 8,
        font: boldFont,
        color: rgb(0.2, 0.4, 0.7),
      })

      yPos -= 12
      page.drawText("Next Sale", {
        x: centerX - 22,
        y: yPos,
        size: 7,
        font,
        color: rgb(0.5, 0.5, 0.5),
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `ticket_${sale.internalNumber}.pdf`
      link.click()
    } catch (error) {
      console.error("Error generating ticket:", error)
      alert("Error al generar el ticket. Por favor, intente nuevamente.")
    }
  }

  const handleView = (sale: any) => {
    setSelectedSale(sale)
    setViewDialogOpen(true)
  }

  const handleDelete = (sale: any) => {
    setSelectedSale(sale)
    setDeleteDialogOpen(true)
  }

  const handleSuccess = () => {
    mutate()
    setViewDialogOpen(false)
    setDeleteDialogOpen(false)
    setSelectedSale(null)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">{t("failedToLoadSales")}</p>
      </div>
    )
  }

  if (!sales || !Array.isArray(sales)) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t("loadingSales")}</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("sales")}</h2>
          <p className="text-muted-foreground">{t("manageSalesTransactions")}</p>
        </div>
        <div className="flex gap-2">
          {sales.length > 0 && (
            <Button variant="outline" onClick={handleExportToExcel}>
              <DownloadIcon />
              {t("exportToExcel")}
            </Button>
          )}
          <Button asChild>
            <Link href="/dashboard/sales/new">
              <PlusIcon />
              {t("newSale")}
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCartIcon className="size-5" />
            {t("salesHistory")}
          </CardTitle>
          <CardDescription>{t("viewManageSales")}</CardDescription>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCartIcon className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noSalesYet")}</h3>
              <p className="text-muted-foreground mb-4">{t("getStartedCreateSale")}</p>
              <Button asChild>
                <Link href="/dashboard/sales/new">
                  <PlusIcon />
                  {t("newSale")}
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("orderNumber")}</TableHead>
                  <TableHead>{t("customer")}</TableHead>
                  <TableHead>{t("items")}</TableHead>
                  <TableHead>{t("total")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale: any) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono font-medium">#{sale.internalNumber}</TableCell>
                    <TableCell>
                      {sale.customer ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dashboard/customers/${sale.customer.id}`)
                          }}
                          className="text-primary hover:underline font-medium"
                        >
                          {sale.customer.name}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">{t("walkInCustomer")}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {sale.items.length} {t("items")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(sale.total)}</TableCell>
                    <TableCell>
                      <Badge variant={sale.status === "completed" ? "default" : "secondary"}>{t(sale.status)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(sale.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleGeneratePDF(sale)}
                          title="Factura A4"
                        >
                          <FileTextIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleGenerateTicket(sale)}
                          title="Ticket"
                        >
                          <PrinterIcon />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleView(sale)}>
                          <EyeIcon />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(sale)}>
                          <TrashIcon />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ViewSaleDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen} sale={selectedSale} />

      <DeleteSaleDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        sale={selectedSale}
        onSuccess={handleSuccess}
      />
    </>
  )
}
