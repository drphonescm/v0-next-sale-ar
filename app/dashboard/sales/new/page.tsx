"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/hooks/use-translation"
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

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer)
    setCustomerSearch("")
    // Si no es "Consumidor Final", cambiar a cuenta corriente por defecto
    if (customer.name !== "Consumidor Final") {
      setSaleCondition("cuenta-corriente")
    } else {
      setSaleCondition("contado")
    }
  }

  const handleDeselectCustomer = () => {
    setSelectedCustomer(null)
    setSaleCondition("contado")
  }

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error(t("pleaseAddAtLeastOneItem"))
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: selectedCustomer?.id || null,
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.productName, // Siempre incluir productName para productos manuales y futuros eliminados
            quantity: item.quantity,
            price: item.price,
          })),
          saleCondition,
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
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("total")}</span>
                  <span className="font-medium">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header with document type and number */}
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">Nueva Venta</h1>
                <p className="text-sm text-muted-foreground">{formatDateTime(saleDate)}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Tipo de Comprobante</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="px-4 py-2 border rounded-md text-sm font-semibold"
                  >
                    <option value="factura-a">Factura A</option>
                    <option value="factura-b">Factura B</option>
                    <option value="factura-c">Factura C</option>
                    <option value="remito">Remito</option>
                    <option value="presupuesto">Presupuesto</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">N° Comprobante</label>
                  <div className="px-4 py-2 bg-muted rounded-md text-sm font-mono">{documentNumber}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer section */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wide text-muted-foreground">
              Datos del Cliente
            </h3>

            {!selectedCustomer ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre o email..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full px-4 py-3 border rounded-md"
                />

                {customerSearch && filteredCustomers?.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredCustomers.map((customer: any) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors"
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-muted p-4 rounded-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">{selectedCustomer.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                  </div>
                  <button onClick={handleDeselectCustomer} className="text-sm text-red-600 hover:text-red-700">
                    Cambiar
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Productos</h3>
              <button
                onClick={() => setShowManualEntry(!showManualEntry)}
                className="text-sm text-primary hover:underline"
              >
                {showManualEntry ? "Buscar producto" : "+ Agregar manual"}
              </button>
            </div>

            {showManualEntry ? (
              <div className="bg-muted p-4 rounded-md space-y-3">
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={manualProduct.name}
                  onChange={(e) => setManualProduct({ ...manualProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Precio"
                    value={manualProduct.price}
                    onChange={(e) => setManualProduct({ ...manualProduct, price: e.target.value })}
                    className="px-3 py-2 border rounded-md"
                  />
                  <input
                    type="number"
                    placeholder="Cantidad"
                    value={manualProduct.quantity}
                    onChange={(e) => setManualProduct({ ...manualProduct, quantity: e.target.value })}
                    className="px-3 py-2 border rounded-md"
                  />
                </div>
                <button
                  onClick={addManualProduct}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Agregar Producto
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o código..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full px-4 py-3 border rounded-md"
                />

                {productSearch && filteredProducts?.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredProducts.map((product: any) => (
                      <button
                        key={product.id}
                        onClick={() => addProduct(product)}
                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.sku}</div>
                          </div>
                          <div className="text-sm font-semibold">{formatCurrency(product.price)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Items table */}
            {items.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Producto</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Cant.</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Precio</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Desc. %</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Total</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-3 text-sm">{item.productCode}</td>
                        <td className="px-4 py-3 text-sm font-medium">{item.productName}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value))}
                            className="w-16 px-2 py-1 border rounded text-center text-sm"
                            min="1"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-sm">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) => updateItem(index, "discount", Number.parseFloat(e.target.value))}
                            className="w-16 px-2 py-1 border rounded text-center text-sm"
                            min="0"
                            max="100"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold">
                          {formatCurrency(calculateItemTotal(item))}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => removeItem(index)} className="text-red-600 hover:text-red-700 text-sm">
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment and totals section */}
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Payment details */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Condición</label>
                <select
                  value={saleCondition}
                  onChange={(e) => setSaleCondition(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  disabled={selectedCustomer && selectedCustomer.name !== "Consumidor Final"}
                >
                  <option value="contado">Contado</option>
                  <option value="cuenta-corriente">Cuenta Corriente</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Forma de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  disabled={saleCondition === "cuenta-corriente"}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta-debito">Tarjeta de Débito</option>
                  <option value="tarjeta-credito">Tarjeta de Crédito</option>
                  <option value="mercadopago">Mercado Pago</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Caja</label>
                <select
                  value={cashRegister}
                  onChange={(e) => setCashRegister(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="caja-principal">Caja Principal</option>
                  <option value="caja-secundaria">Caja Secundaria</option>
                </select>
              </div>
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Observaciones</label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Notas adicionales..."
                className="w-full px-3 py-2 border rounded-md text-sm min-h-[80px]"
              />
            </div>

            {/* Totals */}
            <div className="border-t pt-6 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
              </div>

              {calculateTotalDiscount() > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="font-medium text-red-600">-{formatCurrency(calculateTotalDiscount())}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-lg font-semibold">TOTAL</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleSubmit}
              disabled={loading || items.length === 0}
              className="w-full py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
            >
              {loading ? "Procesando..." : "Completar Venta"}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
