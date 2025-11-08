"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DownloadIcon, FileTextIcon, PrinterIcon, ShieldCheckIcon } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "sonner"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ReportsPage() {
  const { t } = useTranslation()
  const [reportType, setReportType] = useState("sales")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [startTime, setStartTime] = useState("00:00")
  const [endTime, setEndTime] = useState("23:59")
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any[]>([])
  const [showReport, setShowReport] = useState(false)
  const [customerSort, setCustomerSort] = useState("highest")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [auditAction, setAuditAction] = useState("all")
  const [auditEntityType, setAuditEntityType] = useState("all")

  const { data: categories } = useSWR("/api/categories", fetcher)

  const handleGenerateReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: reportType,
      })

      if (reportType === "audit") {
        if (startDate && endDate) {
          const startDateTime = `${startDate}T${startTime}`
          const endDateTime = `${endDate}T${endTime}`
          params.append("startDate", startDateTime)
          params.append("endDate", endDateTime)
        }
        if (auditAction !== "all") {
          params.append("action", auditAction)
        }
        if (auditEntityType !== "all") {
          params.append("entityType", auditEntityType)
        }

        const response = await fetch(`/api/audit?${params}`)
        if (!response.ok) {
          throw new Error("Failed to generate audit report")
        }
        const data = await response.json()
        setReportData(data)
        setShowReport(true)
        toast.success(t("reportGeneratedSuccessfully"))
        setLoading(false)
        return
      }

      if (reportType === "sales" || reportType === "cash") {
        if (startDate && endDate) {
          const startDateTime = `${startDate}T${startTime}`
          const endDateTime = `${endDate}T${endTime}`
          params.append("startDate", startDateTime)
          params.append("endDate", endDateTime)
        }
      }

      if (reportType === "customers") {
        params.append("sort", customerSort)
      }

      if (reportType === "products" && selectedCategory !== "all") {
        params.append("categoryId", selectedCategory)
      }

      const response = await fetch(`/api/reports/data?${params}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate report")
      }

      const data = await response.json()
      setReportData(data)
      setShowReport(true)
      toast.success(t("reportGeneratedSuccessfully"))
    } catch (error) {
      console.error("[v0] Error generating report:", error)
      toast.error(t("failedToGenerateReport"))
    } finally {
      setLoading(false)
    }
  }

  const handleExportToExcel = async () => {
    if (!startDate || !endDate) {
      toast.error(t("pleaseSelectDateRange"))
      return
    }

    setLoading(true)
    try {
      const startDateTime = `${startDate}T${startTime}`
      const endDateTime = `${endDate}T${endTime}`

      const params = new URLSearchParams({
        type: reportType,
        startDate: startDateTime,
        endDate: endDateTime,
      })

      const response = await fetch(`/api/reports/export?${params}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate report")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `reporte_${reportType}_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(t("reportExportedSuccessfully"))
    } catch (error) {
      console.error("[v0] Error exporting report:", error)
      toast.error(t("failedToExportReport"))
    } finally {
      setLoading(false)
    }
  }

  const handlePrintReport = () => {
    if (!showReport || reportData.length === 0) {
      toast.error(t("noReportToPrint"))
      return
    }
    window.print()
  }

  const renderReportTable = () => {
    if (!showReport || reportData.length === 0) {
      return null
    }

    if (reportType === "audit") {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("action")}</TableHead>
              <TableHead>{t("entityType")}</TableHead>
              <TableHead>{t("description")}</TableHead>
              <TableHead>{t("user")}</TableHead>
              <TableHead>{t("ipAddress")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.map((log: any, index: number) => (
              <TableRow key={index}>
                <TableCell className="text-xs">{log.date}</TableCell>
                <TableCell className="text-xs font-medium">{log.action}</TableCell>
                <TableCell className="text-xs">{log.entityType}</TableCell>
                <TableCell className="text-xs">{log.description}</TableCell>
                <TableCell className="text-xs">{log.userId}</TableCell>
                <TableCell className="text-xs">{log.ipAddress}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )
    }

    switch (reportType) {
      case "sales":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("saleNumber")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("total")}</TableHead>
                <TableHead>{t("products")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((sale: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{sale.number}</TableCell>
                  <TableCell>{sale.date}</TableCell>
                  <TableCell>{sale.customer}</TableCell>
                  <TableCell>{sale.status}</TableCell>
                  <TableCell>{sale.total}</TableCell>
                  <TableCell className="text-sm">{sale.products}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )

      case "customers":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("email")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{t("joined")}</TableHead>
                <TableHead>{t("totalSales")}</TableHead>
                <TableHead>{t("totalAmount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((customer: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.joined}</TableCell>
                  <TableCell>{customer.totalSales}</TableCell>
                  <TableCell>{customer.totalAmount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )

      case "products":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("sku")}</TableHead>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("price")}</TableHead>
                <TableHead>{t("stock")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("unitsSold")}</TableHead>
                <TableHead>{t("date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((product: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.price}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>{product.status}</TableCell>
                  <TableCell>{product.unitsSold}</TableCell>
                  <TableCell>{product.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )

      case "cash":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("amount")}</TableHead>
                <TableHead>{t("note")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((movement: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{movement.date}</TableCell>
                  <TableCell>{movement.type}</TableCell>
                  <TableCell>{movement.amount}</TableCell>
                  <TableCell>{movement.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )

      default:
        return null
    }
  }

  const calculateReportTotals = () => {
    if (reportType === "sales") {
      const total = reportData.reduce((sum, sale) => {
        const amount =
          typeof sale.total === "string" ? Number.parseFloat(sale.total.replace(/[^0-9.-]+/g, "")) : sale.total
        return sum + (amount || 0)
      }, 0)
      return { total, count: reportData.length }
    }
    if (reportType === "customers") {
      const totalAmount = reportData.reduce((sum, customer) => {
        const amount =
          typeof customer.totalAmount === "string"
            ? Number.parseFloat(customer.totalAmount.replace(/[^0-9.-]+/g, ""))
            : customer.totalAmount
        return sum + (amount || 0)
      }, 0)
      const totalSales = reportData.reduce((sum, customer) => sum + (customer.totalSales || 0), 0)
      return { totalAmount, totalSales, count: reportData.length }
    }
    if (reportType === "products") {
      const totalSold = reportData.reduce((sum, product) => sum + (product.unitsSold || 0), 0)
      return { totalSold, count: reportData.length }
    }
    if (reportType === "cash") {
      const total = reportData.reduce((sum, movement) => {
        const amount =
          typeof movement.amount === "string"
            ? Number.parseFloat(movement.amount.replace(/[^0-9.-]+/g, ""))
            : movement.amount
        return sum + (amount || 0)
      }, 0)
      return { total, count: reportData.length }
    }
    return { count: reportData.length }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      <style jsx global>
        {`
        @media screen {
          .print-area {
            display: none;
          }
        }

        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }

          body * {
            visibility: hidden;
          }

          .print-area,
          .print-area * {
            visibility: visible;
            display: block !important;
          }

          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
          }

          .no-print {
            display: none !important;
          }

          .print-header {
            border-bottom: 3px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }

          .print-title {
            font-size: 28px;
            font-weight: bold;
            color: #000;
            margin-bottom: 10px;
          }

          .print-subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
          }

          .print-info-box {
            background: #f5f5f5;
            border: 1px solid #ddd;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
          }

          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            display: table !important;
          }

          .print-table thead {
            background: #000;
            color: white;
            display: table-header-group !important;
          }

          .print-table tbody {
            display: table-row-group !important;
          }

          .print-table tr {
            display: table-row !important;
            page-break-inside: avoid;
          }

          .print-table th {
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
            border: 1px solid #000;
            display: table-cell !important;
          }

          .print-table td {
            padding: 10px 8px;
            border: 1px solid #ddd;
            font-size: 10px;
            color: #000;
            display: table-cell !important;
          }

          .print-table tbody tr:nth-child(even) {
            background: #f9f9f9;
          }

          .print-totals {
            border-top: 3px solid #000;
            padding-top: 20px;
            margin-top: 20px;
          }

          .print-total-row {
            display: flex !important;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
          }

          .print-total-row.main {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 15px;
            margin-top: 10px;
          }

          .print-footer {
            border-top: 1px solid #ddd;
            padding-top: 15px;
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
          }
        `}
      </style>

      <div className="no-print">
        <h1 className="text-2xl font-bold">{t("reports")}</h1>
        <p className="text-sm text-muted-foreground">{t("reportsDescription")}</p>
      </div>

      <Card className="no-print">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileTextIcon className="size-4" />
            {t("generateReport")}
          </CardTitle>
          <CardDescription className="text-xs">{t("selectReportTypeAndDateRange")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="reportType" className="text-xs">
                {t("reportType")}
              </Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="reportType" className="h-9 text-sm">
                  <SelectValue placeholder={t("selectReportType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">{t("sales")}</SelectItem>
                  <SelectItem value="customers">{t("customers")}</SelectItem>
                  <SelectItem value="products">{t("products")}</SelectItem>
                  <SelectItem value="cash">{t("cashFlow")}</SelectItem>
                  <SelectItem value="audit">
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon className="size-3" />
                      {t("audit")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(reportType === "sales" || reportType === "cash" || reportType === "audit") && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-xs">
                    {t("startDate")} ({t("optional")})
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
                    {t("endDate")} ({t("optional")})
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </>
            )}

            {reportType === "audit" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="auditAction" className="text-xs">
                    {t("action")}
                  </Label>
                  <Select value={auditAction} onValueChange={setAuditAction}>
                    <SelectTrigger id="auditAction" className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allActions")}</SelectItem>
                      <SelectItem value="DELETE_PRODUCT">{t("deleteProduct")}</SelectItem>
                      <SelectItem value="UPDATE_PRODUCT_PRICE">{t("updateProductPrice")}</SelectItem>
                      <SelectItem value="UPDATE_PRODUCT_STOCK">{t("updateProductStock")}</SelectItem>
                      <SelectItem value="CREATE_SALE">{t("createSale")}</SelectItem>
                      <SelectItem value="DELETE_SALE">{t("deleteSale")}</SelectItem>
                      <SelectItem value="DELETE_CUSTOMER">{t("deleteCustomer")}</SelectItem>
                      <SelectItem value="UPDATE_CUSTOMER_CREDIT">{t("updateCustomerCredit")}</SelectItem>
                      <SelectItem value="CREATE_CASH_MOVEMENT">{t("createCashMovement")}</SelectItem>
                      <SelectItem value="DELETE_CASH_MOVEMENT">{t("deleteCashMovement")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="auditEntityType" className="text-xs">
                    {t("entityType")}
                  </Label>
                  <Select value={auditEntityType} onValueChange={setAuditEntityType}>
                    <SelectTrigger id="auditEntityType" className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allEntities")}</SelectItem>
                      <SelectItem value="Product">{t("product")}</SelectItem>
                      <SelectItem value="Sale">{t("sale")}</SelectItem>
                      <SelectItem value="Customer">{t("customer")}</SelectItem>
                      <SelectItem value="CashMovement">{t("cashMovement")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {reportType === "customers" && (
              <div className="space-y-1.5">
                <Label htmlFor="customerSort" className="text-xs">
                  {t("sortBy")}
                </Label>
                <Select value={customerSort} onValueChange={setCustomerSort}>
                  <SelectTrigger id="customerSort" className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="highest">{t("highestDebt")}</SelectItem>
                    <SelectItem value="lowest">{t("lowestDebt")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {reportType === "products" && (
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs">
                  {t("category")}
                </Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category" className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allCategories")}</SelectItem>
                    {categories?.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {(reportType === "sales" || reportType === "cash" || reportType === "audit") && startDate && endDate && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="startTime" className="text-xs">
                  {t("startTime")}
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endTime" className="text-xs">
                  {t("endTime")}
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              onClick={handleGenerateReport}
              disabled={loading}
              size="sm"
              variant="default"
              className="h-9 text-sm"
            >
              <FileTextIcon className="mr-2 size-3" />
              {loading ? t("generating") : t("generateReport")}
            </Button>

            <Button
              onClick={handleExportToExcel}
              disabled={loading || !startDate || !endDate || reportType === "audit"}
              size="sm"
              variant="outline"
              className="h-9 text-sm bg-transparent"
            >
              <DownloadIcon className="mr-2 size-3" />
              {t("exportToExcel")}
            </Button>

            {showReport && reportData.length > 0 && (
              <Button onClick={handlePrintReport} size="sm" variant="outline" className="h-9 text-sm bg-transparent">
                <PrinterIcon className="mr-2 size-3" />
                {t("printReport")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showReport && reportData.length > 0 && (
        <Card className="no-print">
          <CardHeader className="p-4">
            <CardTitle className="text-base">
              {t("reportType")}: {t(reportType)}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("period")}: {startDate} {startTime} - {endDate} {endTime}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="rounded-md border">{renderReportTable()}</div>
            <div className="mt-3 text-xs text-muted-foreground">
              {t("totalRecords")}: {reportData.length}
            </div>
          </CardContent>
        </Card>
      )}

      {showReport && reportData.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("noDataFoundForSelectedCriteria")}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
