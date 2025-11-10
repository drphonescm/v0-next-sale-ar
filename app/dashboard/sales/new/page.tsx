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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header - reduced padding */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard/sales">
            <Button variant="ghost" size="icon">
              <ArrowLeftIcon />
            </Button>
          </Link>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{t("newSale")}</h2>
            <p className="text-xs text-muted-foreground">{formatDateTime(saleDate)}</p>
          </div>
        </div>

        {/* Customer section - reduced padding */}
        <Card>
          <div className="p-4 space-y-3">
            <h3 className="font-semibold text-base">{t("customer")}</h3>

            <div className="relative">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchCustomers")}
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {customerSearch && filteredCustomers && filteredCustomers.length > 0 && (
              <div className="bg-muted rounded-lg border max-h-40 overflow-y-auto">
                {filteredCustomers.map((customer: any) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(customer)
                      setCustomerSearch("")
                    }}
                    className="w-full text-left p-2 hover:bg-accent transition-colors border-b last:border-0"
                  >
                    <p className="font-medium text-sm">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.email || t("noEmail")}</p>
                  </button>
                ))}
              </div>
            )}

            {customerSearch && filteredCustomers && filteredCustomers.length === 0 && (
              <div className="bg-muted p-3 rounded-lg border text-center">
                <p className="text-xs text-muted-foreground mb-2">{t("noCustomersFound")}</p>
                <Link href="/dashboard/customers/new">
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs bg-transparent">
                    <PlusIcon className="h-3 w-3 mr-1" />
                    {t("createNewCustomer")}
                  </Button>
                </Link>
              </div>
            )}

            {selectedCustomer ? (
              <div className="bg-muted p-3 rounded-lg border space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{selectedCustomer.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedCustomer.email || t("noEmail")}</p>
                    <p className="text-xs text-muted-foreground">{selectedCustomer.phone || t("noPhone")}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-destructive hover:text-destructive h-7"
                  >
                    {t("remove")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-muted p-3 rounded-lg border text-center text-sm text-muted-foreground">
                {t("noCustomerSelected")}
              </div>
            )}
          </div>
        </Card>

        {/* Products - moved above basic data */}
        <Card>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">{t("productsOfSale")}</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowManualEntry(!showManualEntry)}
                className="h-8 text-xs"
              >
                <PlusIcon className="size-3 mr-1" />
                {t("addManualProduct")}
              </Button>
            </div>

            {showManualEntry && (
              <div className="bg-muted p-3 rounded-lg border space-y-2">
                <h4 className="font-medium text-xs">{t("manualProductEntry")}</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder={t("productName")}
                    value={manualProduct.name}
                    onChange={(e) => setManualProduct({ ...manualProduct, name: e.target.value })}
                    className="h-8 text-sm"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={t("price")}
                    value={manualProduct.price}
                    onChange={(e) => setManualProduct({ ...manualProduct, price: e.target.value })}
                    className="h-8 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder={t("quantity")}
                    value={manualProduct.quantity}
                    onChange={(e) => setManualProduct({ ...manualProduct, quantity: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={addManualProduct} className="h-7 text-xs">
                    {t("add")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowManualEntry(false)}
                    className="h-7 text-xs"
                  >
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            )}

            {/* Product search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchProducts")}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Product search results */}
            {productSearch && filteredProducts && filteredProducts.length > 0 && (
              <div className="bg-muted rounded-lg border max-h-40 overflow-y-auto">
                {filteredProducts.map((product: any) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    className="w-full text-left p-2 hover:bg-accent flex justify-between items-center transition-colors border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.sku} - Stock: {product.stock}
                      </p>
                    </div>
                    <p className="font-semibold text-sm">{formatCurrency(product.price)}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Products table */}
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="h-9">
                    <TableHead className="text-xs">Código</TableHead>
                    <TableHead className="text-xs">Cant.</TableHead>
                    <TableHead className="text-xs">Producto</TableHead>
                    <TableHead className="text-xs">Precio</TableHead>
                    <TableHead className="text-xs">Bonif.</TableHead>
                    <TableHead className="text-xs">Importe</TableHead>
                    <TableHead className="text-xs"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-sm text-muted-foreground">
                        {t("noItemsAdded")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow key={index} className="h-12">
                        <TableCell className="text-sm">{item.productCode || "-"}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value))}
                            className="w-16 h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell className="text-sm">{item.productName}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateItem(index, "price", Number.parseFloat(e.target.value))}
                            className="w-24 h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount}
                            onChange={(e) => updateItem(index, "discount", Number.parseFloat(e.target.value))}
                            className="w-16 h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          {formatCurrency(calculateItemTotal(item))}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="text-destructive hover:text-destructive h-8 w-8"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            {items.length > 0 && (
              <div className="bg-muted p-3 rounded-lg border space-y-1.5">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Descuento ({((calculateTotalDiscount() / calculateSubtotal()) * 100).toFixed(2)}%):</span>
                  <span>{formatCurrency(calculateTotalDiscount())}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-1.5 border-t">
                  <span>Total:</span>
                  <span className="text-green-600 dark:text-green-400">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Basic data - moved below products */}
        <Card>
          <Accordion type="single" collapsible defaultValue="basic-data">
            <AccordionItem value="basic-data">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <span className="font-semibold text-sm">{t("basicData")}</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">{t("documentType")}</Label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="factura-c">Factura C</SelectItem>
                        <SelectItem value="recibo-pago">Recibo de pago</SelectItem>
                        <SelectItem value="devolucion-pago">Devolución de pago</SelectItem>
                        <SelectItem value="presupuesto">Presupuesto</SelectItem>
                        <SelectItem value="pedido">Pedido</SelectItem>
                        <SelectItem value="remito">Remito</SelectItem>
                        <SelectItem value="remito-devolucion">Remito de devolución</SelectItem>
                        <SelectItem value="nota-credito-c">Nota de Crédito C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-xs">{t("documentNumber")}</Label>
                    <Input value={documentNumber} readOnly className="h-9 text-sm" />
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-xs">{t("saleCondition")}</Label>
                    <Select value={saleCondition} onValueChange={setSaleCondition}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contado">Contado</SelectItem>
                        <SelectItem value="cuenta-corriente">Cuenta corriente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        {/* Observations */}
        <Card>
          <Accordion type="single" collapsible>
            <AccordionItem value="observations">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <span className="font-semibold text-sm">{t("observations")}</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <Textarea
                  placeholder={t("addObservations")}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="min-h-[80px] text-sm"
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        {/* Payment receipt */}
        <Card>
          <Accordion type="single" collapsible>
            <AccordionItem value="payment">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <span className="font-semibold text-sm">{t("paymentReceipt")}</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">{t("paymentMethod")}</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="tarjeta-debito">Tarjeta de débito</SelectItem>
                        <SelectItem value="tarjeta-credito">Tarjeta de crédito</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-xs">{t("cashRegister")}</Label>
                    <Select value={cashRegister} onValueChange={setCashRegister}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="caja-principal">Caja principal</SelectItem>
                        <SelectItem value="caja-secundaria">Caja secundaria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-xs">{t("concept")}</Label>
                    <Select value={paymentConcept} onValueChange={setPaymentConcept}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="varias">Varias</SelectItem>
                        <SelectItem value="venta-productos">Venta de productos</SelectItem>
                        <SelectItem value="servicios">Servicios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        {/* Action buttons */}
        <div className="space-y-2 pb-4">
          <Button
            onClick={handleSubmit}
            disabled={loading || items.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-10 text-sm"
          >
            {loading && <Spinner className="mr-2" />}
            {t("completeSale")}
          </Button>
          <Link href="/dashboard/sales" className="block">
            <Button variant="outline" className="w-full bg-transparent h-10 text-sm">
              {t("cancel")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
