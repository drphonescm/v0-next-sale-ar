"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeftIcon, SearchIcon, TrashIcon, PrinterIcon, FileTextIcon, PlusIcon } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "react-toastify"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface SaleItem {
  productId: string | null
  productCode: string
  productName: string
  quantity: number
  price: number
  discount: number
}

export default function NewSalePage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  // Basic data
  const [documentType, setDocumentType] = useState("factura-c")
  const [documentNumber, setDocumentNumber] = useState("")
  const [saleDate, setSaleDate] = useState(new Date())
  const [saleCondition, setSaleCondition] = useState("contado")

  // Customer data
  const [customerSearch, setCustomerSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  // Product search
  const [productSearch, setProductSearch] = useState("")
  const [items, setItems] = useState<SaleItem[]>([])

  // Payment data
  const [paymentMethod, setPaymentMethod] = useState("efectivo")
  const [paymentConcept, setPaymentConcept] = useState("varias")
  const [cashRegister, setCashRegister] = useState("caja-principal")

  // Observations
  const [observations, setObservations] = useState("")

  // Sale completed
  const [saleCompleted, setSaleCompleted] = useState(false)
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null)
  const [completedSaleNumber, setCompletedSaleNumber] = useState<number>(0)

  const { data: products } = useSWR("/api/products", fetcher)
  const { data: customers } = useSWR("/api/customers", fetcher)
  const { data: companySettings } = useSWR("/api/settings", fetcher)

  useEffect(() => {
    const generateInvoiceNumber = async () => {
      try {
        const response = await fetch("/api/sales/next-number")
        const data = await response.json()
        setDocumentNumber(data.number.toString().padStart(8, "0"))
      } catch (error) {
        console.error("[v0] Error generating invoice number:", error)
      }
    }
    generateInvoiceNumber()
  }, [])

  // Update date/time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setSaleDate(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const filteredCustomers = customers?.filter((customer: any) => {
    const searchLower = customerSearch.toLowerCase()
    return customer.name.toLowerCase().includes(searchLower) || customer.email?.toLowerCase().includes(searchLower)
  })

  const filteredProducts = products?.filter((product: any) => {
    const searchLower = productSearch.toLowerCase()
    return product.name.toLowerCase().includes(searchLower) || product.sku?.toLowerCase().includes(searchLower)
  })

  const addProduct = (product: any) => {
    const existingIndex = items.findIndex((item) => item.productId === product.id)

    if (existingIndex >= 0) {
      const newItems = [...items]
      newItems[existingIndex].quantity += 1
      setItems(newItems)
    } else {
      setItems([
        ...items,
        {
          productId: product.id,
          productCode: product.sku || "",
          productName: product.name,
          quantity: 1,
          price: product.price,
          discount: 0,
        },
      ])
    }

    setProductSearch("")
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateItemTotal = (item: SaleItem) => {
    const subtotal = item.price * item.quantity
    const discountAmount = (subtotal * item.discount) / 100
    return subtotal - discountAmount
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const calculateTotalDiscount = () => {
    return items.reduce((sum, item) => {
      const subtotal = item.price * item.quantity
      return sum + (subtotal * item.discount) / 100
    }, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() - calculateTotalDiscount()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error(t("pleaseAddAtLeastOneItem"))
      return
    }

    setLoading(true)

    try {
      let finalCustomerId = selectedCustomer?.id

      if (!finalCustomerId) {
        // Buscar cliente "Consumidor Final"
        const customersResponse = await fetch("/api/customers")
        const allCustomers = await customersResponse.json()
        let consumidorFinal = allCustomers.find((c: any) => c.name === "Consumidor Final")

        // Si no existe, crearlo
        if (!consumidorFinal) {
          const createResponse = await fetch("/api/customers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "Consumidor Final",
              email: null,
              phone: null,
            }),
          })
          if (createResponse.ok) {
            consumidorFinal = await createResponse.json()
          }
        }

        finalCustomerId = consumidorFinal?.id || null
      }

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: finalCustomerId,
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.productName, // Siempre incluir productName para productos manuales y futuros eliminados
            quantity: item.quantity,
            price: item.price,
          })),
          documentType,
          paymentMethod,
          observations,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create sale")
      }

      const data = await response.json()
      setCompletedSaleId(data.id)
      setCompletedSaleNumber(data.internalNumber)
      setSaleCompleted(true)
      toast.success(t("saleCompletedSuccessfully"))
    } catch (error: any) {
      console.error("[v0] Error creating sale:", error)
      toast.error(error.message || t("failedToCreateSale"))
    } finally {
      setLoading(false)
    }
  }

  const generateA4Invoice = async () => {
    try {
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib")

      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([595, 842]) // A4 size
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      const { width, height } = page.getSize()
      let yPos = height - 40

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
      const invoiceNum = completedSaleNumber.toString().padStart(8, "0")
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
      const customerName = selectedCustomer?.name || "Consumidor Final"
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

      page.drawText("Consumidor Final", {
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

      page.drawText(selectedCustomer?.email || "No especificado", {
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

      page.drawText(selectedCustomer?.phone || "No especificado", {
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
      items.forEach((item, index) => {
        if (index % 2 === 0) {
          page.drawRectangle({
            x: 40,
            y: yPos - 18,
            width: width - 80,
            height: 20,
            color: rgb(0.98, 0.98, 0.98),
          })
        }

        page.drawText(item.productCode || "-", { x: 50, y: yPos - 12, size: 9, font, color: rgb(0.2, 0.2, 0.2) })
        page.drawText(item.productName.substring(0, 30), {
          x: 130,
          y: yPos - 12,
          size: 9,
          font,
          color: rgb(0.2, 0.2, 0.2),
        })
        page.drawText(item.quantity.toString(), { x: 370, y: yPos - 12, size: 9, font, color: rgb(0.2, 0.2, 0.2) })
        page.drawText(`$${item.price.toFixed(2)}`, { x: 415, y: yPos - 12, size: 9, font, color: rgb(0.2, 0.2, 0.2) })
        page.drawText(`$${calculateItemTotal(item).toFixed(2)}`, {
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

      page.drawText(`$${calculateSubtotal().toFixed(2)}`, {
        x: width - 130,
        y: yPos,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })

      yPos -= 20

      // Descuento (si existe)
      if (calculateTotalDiscount() > 0) {
        page.drawText("Descuento:", {
          x: width - 220,
          y: yPos,
          size: 10,
          font: boldFont,
          color: rgb(0.7, 0.2, 0.2),
        })

        page.drawText(`-$${calculateTotalDiscount().toFixed(2)}`, {
          x: width - 130,
          y: yPos,
          size: 10,
          font,
          color: rgb(0.7, 0.2, 0.2),
        })

        yPos -= 25
      }

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

      page.drawText(`$${calculateTotal().toFixed(2)}`, {
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
      window.open(url, "_blank")
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Error al generar la factura. Por favor, intente nuevamente.")
    }
  }

  const generateTicketInvoice = async () => {
    try {
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib")

      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([226, 800])
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
      const invoiceNum = completedSaleNumber.toString().padStart(8, "0")
      page.drawText(`N° ${invoiceNum}`, {
        x: centerX - 35,
        y: yPos,
        size: 9,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })

      yPos -= 12
      page.drawText(formatDateTime(saleDate), {
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
      const customerName = selectedCustomer?.name || "Consumidor Final"
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
      items.forEach((item) => {
        page.drawText(item.productName.substring(0, 28), {
          x: 10,
          y: yPos,
          size: 7,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        })
        yPos -= 10
        page.drawText(`${item.quantity} x ${formatCurrency(item.price)}`, {
          x: 10,
          y: yPos,
          size: 6,
          font,
          color: rgb(0.4, 0.4, 0.4),
        })
        page.drawText(formatCurrency(calculateItemTotal(item)), {
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
      page.drawText(formatCurrency(calculateTotal()), {
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
      window.open(url, "_blank")
    } catch (error) {
      console.error("Error generating ticket:", error)
      alert("Error al generar el ticket. Por favor, intente nuevamente.")
    }
  }

  const [manualProduct, setManualProduct] = useState({
    name: "",
    price: "",
    quantity: "1",
  })
  const [showManualEntry, setShowManualEntry] = useState(false)

  const addManualProduct = () => {
    if (!manualProduct.name || !manualProduct.price) {
      toast.error(t("pleaseEnterProductDetails"))
      return
    }

    setItems([
      ...items,
      {
        productId: null, // Manual product has no ID
        productCode: "MANUAL",
        productName: manualProduct.name,
        quantity: Number.parseInt(manualProduct.quantity),
        price: Number.parseFloat(manualProduct.price),
        discount: 0,
      },
    ])

    setManualProduct({ name: "", price: "", quantity: "1" })
    setShowManualEntry(false)
    toast.success(t("manualProductAdded"))
  }

  if (saleCompleted) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">{t("saleCompleted")}</h2>
              <p className="text-muted-foreground">{t("saleCompletedSuccessfully")}</p>
            </div>

            <div className="bg-muted p-6 rounded-lg space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-muted-foreground">{t("date")}</span>
                <span className="font-medium">{formatDateTime(saleDate)}</span>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">{t("items")}</h3>
                {items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(calculateItemTotal(item))}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center text-xl">
                  <span className="font-bold">{t("total")}</span>
                  <span className="font-bold text-2xl text-green-600 dark:text-green-400">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button onClick={generateA4Invoice} className="bg-blue-600 hover:bg-blue-700">
                <FileTextIcon className="mr-2 h-4 w-4" />
                {t("printA4Invoice")}
              </Button>
              <Button onClick={generateTicketInvoice} variant="outline">
                <PrinterIcon className="mr-2 h-4 w-4" />
                {t("printTicketInvoice")}
              </Button>
            </div>

            <Link href="/dashboard/sales" className="block">
              <Button variant="secondary" className="w-full">
                {t("backToSales")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Redesigned layout to look like an invoice
  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Back button */}
        <Link href="/dashboard/sales">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver a Ventas
          </Button>
        </Link>

        {/* Invoice-style card */}
        <Card className="shadow-lg">
          <CardContent className="p-0">
            {/* Header with company info and document type */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold">{companySettings?.name || "Next Sale AR"}</h1>
                  <p className="text-sm text-blue-100">Sistema de Gestión de Ventas</p>
                  {companySettings?.cuit && <p className="text-sm text-blue-100">CUIT: {companySettings.cuit}</p>}
                </div>

                {/* Document type badge */}
                <div className="bg-white text-blue-900 px-6 py-4 rounded-lg shadow-md min-w-[200px]">
                  <div className="text-xs font-semibold mb-1">TIPO DE COMPROBANTE</div>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger className="h-10 border-0 bg-transparent p-0 font-bold text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="factura-c">Factura C</SelectItem>
                      <SelectItem value="recibo-pago">Recibo de Pago</SelectItem>
                      <SelectItem value="devolucion-pago">Devolución de Pago</SelectItem>
                      <SelectItem value="presupuesto">Presupuesto</SelectItem>
                      <SelectItem value="pedido">Pedido</SelectItem>
                      <SelectItem value="remito">Remito</SelectItem>
                      <SelectItem value="remito-devolucion">Remito de Devolución</SelectItem>
                      <SelectItem value="nota-credito-c">Nota de Crédito C</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs mt-2 text-blue-700">Nº {documentNumber}</div>
                </div>
              </div>

              {/* Date and condition */}
              <div className="mt-4 flex gap-6 text-sm text-blue-100">
                <div>
                  <span className="font-semibold">Fecha:</span> {formatDateTime(saleDate)}
                </div>
                <div>
                  <span className="font-semibold">Condición:</span>
                  <Select value={saleCondition} onValueChange={setSaleCondition}>
                    <SelectTrigger className="inline-flex ml-2 h-7 w-auto border-blue-400 bg-blue-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contado">Contado</SelectItem>
                      <SelectItem value="cuenta-corriente">Cuenta Corriente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Customer section - invoice style */}
            <div className="p-6 border-b bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">Datos del Cliente</h3>
                {!selectedCustomer && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("customer-search")?.focus()}
                  >
                    <SearchIcon className="h-4 w-4 mr-2" />
                    Buscar Cliente
                  </Button>
                )}
              </div>

              {selectedCustomer ? (
                <div className="bg-muted/50 p-4 rounded-lg border-2 border-blue-200">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="font-semibold text-lg">{selectedCustomer.name}</div>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        {selectedCustomer.email && <div>Email: {selectedCustomer.email}</div>}
                        {selectedCustomer.phone && <div>Teléfono: {selectedCustomer.phone}</div>}
                        <div>Condición IVA: Consumidor Final</div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCustomer(null)}
                      className="text-destructive hover:text-destructive"
                    >
                      Cambiar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customer-search"
                      placeholder="Buscar cliente por nombre o email..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>

                  {customerSearch && filteredCustomers && filteredCustomers.length > 0 && (
                    <div className="bg-white border rounded-lg shadow-md max-h-48 overflow-y-auto">
                      {filteredCustomers.map((customer: any) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setCustomerSearch("")
                          }}
                          className="w-full text-left p-3 hover:bg-blue-50 transition-colors border-b last:border-0"
                        >
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.email || "Sin email"}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {!selectedCustomer && !customerSearch && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800">
                      Si no selecciona un cliente, se facturará como "Consumidor Final"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Products section - invoice table style */}
            <div className="p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Detalle de Productos</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowManualEntry(!showManualEntry)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Producto Manual
                </Button>
              </div>

              {showManualEntry && (
                <div className="bg-muted p-4 rounded-lg border mb-4 space-y-3">
                  <h4 className="font-medium text-sm">Agregar Producto Manual</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      placeholder="Nombre del producto"
                      value={manualProduct.name}
                      onChange={(e) => setManualProduct({ ...manualProduct, name: e.target.value })}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Precio"
                      value={manualProduct.price}
                      onChange={(e) => setManualProduct({ ...manualProduct, price: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Cantidad"
                      value={manualProduct.quantity}
                      onChange={(e) => setManualProduct({ ...manualProduct, quantity: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={addManualProduct}>
                      Agregar
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowManualEntry(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Product search */}
              <div className="relative mb-4">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto por nombre o código..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              {productSearch && filteredProducts && filteredProducts.length > 0 && (
                <div className="bg-white border rounded-lg shadow-md max-h-48 overflow-y-auto mb-4">
                  {filteredProducts.map((product: any) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product)}
                      className="w-full text-left p-3 hover:bg-blue-50 flex justify-between items-center transition-colors border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.sku} - Stock: {product.stock}
                        </p>
                      </div>
                      <p className="font-semibold text-lg text-blue-600">{formatCurrency(product.price)}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Invoice-style table */}
              <div className="border-2 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-600 hover:bg-blue-600">
                      <TableHead className="text-white font-bold">Código</TableHead>
                      <TableHead className="text-white font-bold">Producto</TableHead>
                      <TableHead className="text-white font-bold text-center">Cant.</TableHead>
                      <TableHead className="text-white font-bold text-right">Precio Unit.</TableHead>
                      <TableHead className="text-white font-bold text-center">Bonif. %</TableHead>
                      <TableHead className="text-white font-bold text-right">Importe</TableHead>
                      <TableHead className="text-white font-bold text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <SearchIcon className="h-12 w-12 text-muted-foreground/50" />
                            <p>No se han agregado productos</p>
                            <p className="text-sm">Busque productos arriba para agregarlos a la factura</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => (
                        <TableRow key={index} className="hover:bg-blue-50/50">
                          <TableCell className="font-mono">{item.productCode || "-"}</TableCell>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value))}
                              className="w-20 text-center mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateItem(index, "price", Number.parseFloat(e.target.value))}
                              className="w-28 text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount}
                              onChange={(e) => updateItem(index, "discount", Number.parseFloat(e.target.value))}
                              className="w-20 text-center mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right font-bold text-lg text-green-600">
                            {formatCurrency(calculateItemTotal(item))}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Totals section - invoice style */}
              {items.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <div className="w-80 space-y-3">
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    {calculateTotalDiscount() > 0 && (
                      <div className="flex justify-between items-center text-lg text-red-600">
                        <span>Descuento:</span>
                        <span className="font-semibold">-{formatCurrency(calculateTotalDiscount())}</span>
                      </div>
                    )}
                    <div className="border-t-2 border-blue-600 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">TOTAL:</span>
                        <span className="text-3xl font-bold text-blue-600">{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment and observations section */}
            <div className="p-6 bg-muted/30 border-t space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Forma de Pago</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta-debito">Tarjeta de Débito</SelectItem>
                      <SelectItem value="tarjeta-credito">Tarjeta de Crédito</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Caja</Label>
                  <Select value={cashRegister} onValueChange={setCashRegister}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caja-principal">Caja Principal</SelectItem>
                      <SelectItem value="caja-secundaria">Caja Secundaria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Observaciones</Label>
                <Textarea
                  placeholder="Notas adicionales sobre la venta..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="p-6 bg-white border-t space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={loading || items.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold"
              >
                {loading && <Spinner className="mr-2" />}
                {loading ? "Procesando Venta..." : "Completar Venta"}
              </Button>
              <Link href="/dashboard/sales" className="block">
                <Button variant="outline" className="w-full h-11 bg-transparent">
                  Cancelar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
