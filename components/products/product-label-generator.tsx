"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { DownloadIcon, Loader2Icon } from "lucide-react"
import Barcode from "react-barcode"
import { toJpeg } from "html-to-image"

interface ProductLabelGeneratorProps {
  product: any
  company: any
}

export function ProductLabelGenerator({ product, company }: ProductLabelGeneratorProps) {
  const labelRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    if (!labelRef.current) return

    setIsGenerating(true)
    try {
      const dataUrl = await toJpeg(labelRef.current, {
        quality: 1.0, // Máxima calidad JPEG
        backgroundColor: "white",
        pixelRatio: 3, // 3x resolución para alta calidad de impresión
        cacheBust: true, // Evitar caché de imágenes
      })
      const link = document.createElement("a")
      link.download = `etiqueta-${product.sku || product.name}.jpg`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Error generating label:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getPriceFontSize = (price: string) => {
    const length = price.length
    if (length <= 6) return "text-7xl" // $1.000
    if (length <= 8) return "text-6xl" // $10.000
    if (length <= 10) return "text-5xl" // $100.000
    return "text-4xl" // $1.000.000+
  }

  const formattedPrice = formatCurrency(product.price).replace(/\s/g, "")
  const priceFontSize = getPriceFontSize(formattedPrice)

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Label Preview (Visible) */}
      <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
        <div
          ref={labelRef}
          className="flex w-[900px] h-[375px] bg-white relative"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          {company?.logoUrl && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white rounded-full p-3 shadow-md border-2 border-gray-100 z-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={company.logoUrl || "/placeholder.svg"}
                alt="Logo"
                className="h-16 w-16 object-contain"
                crossOrigin="anonymous"
              />
            </div>
          )}

          {/* Left Side - Product Info */}
          <div className="flex-1 p-8 flex flex-col justify-between relative border-r border-gray-100 overflow-hidden">
            <div className="flex-1 flex items-center my-3 pt-20">
              <h3 className="text-5xl font-bold leading-tight text-black text-left w-full line-clamp-2">
                {product.name}
              </h3>
            </div>

            <div className="mt-auto pt-3 flex justify-start">
              <Barcode
                value={product.sku || product.id.substring(0, 8)}
                height={65}
                width={2.5}
                fontSize={20}
                margin={0}
                displayValue={true}
                background="transparent"
                lineColor="#000000"
              />
            </div>
          </div>

          {/* Right Side - Price */}
          <div className="w-[450px] bg-yellow-400 flex flex-col items-center justify-center p-6 relative shrink-0">
            <span className="text-2xl font-bold text-black/60 mb-3 uppercase tracking-widest">Precio</span>
            <div className="text-center w-full px-2">
              <span className={`block ${priceFontSize} font-extrabold tracking-tighter text-black whitespace-nowrap`}>
                {formattedPrice}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={handleDownload} disabled={isGenerating} size="sm" className="w-full max-w-[900px]">
        {isGenerating ? (
          <>
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Descargar Etiqueta JPG
          </>
        )}
      </Button>
    </div>
  )
}
