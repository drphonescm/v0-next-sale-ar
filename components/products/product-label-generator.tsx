"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { DownloadIcon, Loader2Icon } from 'lucide-react'
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
      const dataUrl = await toJpeg(labelRef.current, { quality: 0.95, backgroundColor: "white" })
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

  const formattedPrice = formatCurrency(product.price).replace(/\s/g, '')
  const priceFontSize = getPriceFontSize(formattedPrice)

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Label Preview (Visible) */}
      <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
        <div
          ref={labelRef}
          className="flex w-[600px] h-[250px] bg-white"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          {/* Left Side - Product Info */}
          <div className="flex-1 p-5 flex flex-col justify-between relative border-r border-gray-100 overflow-hidden">
            <div className="flex flex-col items-start gap-1">
              {company?.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={company.logoUrl || "/placeholder.svg"} 
                  alt="Logo" 
                  className="h-12 object-contain max-w-[150px]" 
                  crossOrigin="anonymous"
                />
              )}
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wider mt-1">
                {company?.name || "Empresa"}
              </span>
            </div>

            <div className="flex-1 flex items-center my-2">
              <h3 className="text-4xl font-bold leading-tight text-black text-left w-full line-clamp-2">
                {product.name}
              </h3>
            </div>

            <div className="mt-auto pt-2 flex justify-start">
              <Barcode 
                value={product.sku || product.id.substring(0, 8)} 
                height={45} 
                width={2}
                fontSize={16}
                margin={0}
                displayValue={true}
                background="transparent"
                lineColor="#000000"
              />
            </div>
          </div>

          {/* Right Side - Price */}
          <div className="w-[300px] bg-yellow-400 flex flex-col items-center justify-center p-4 relative shrink-0">
            <span className="text-lg font-bold text-black/60 mb-2 uppercase tracking-widest">Precio</span>
            <div className="text-center w-full px-1">
              <span className={`block ${priceFontSize} font-extrabold tracking-tighter text-black whitespace-nowrap`}>
                {formattedPrice}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={handleDownload} disabled={isGenerating} size="sm" className="w-full max-w-[600px]">
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
