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
    }).format(amount)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Label Preview (Visible) */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <div
          ref={labelRef}
          className="flex w-[400px] h-[200px] bg-white"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          {/* Left Side - Product Info */}
          <div className="flex-1 p-4 flex flex-col justify-between relative">
            <div className="flex justify-between items-start">
              {company?.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={company.logoUrl || "/placeholder.svg"} 
                  alt="Logo" 
                  className="h-8 object-contain max-w-[80px]" 
                  crossOrigin="anonymous"
                />
              )}
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right flex-1 ml-2">
                {company?.name || "Empresa"}
              </span>
            </div>

            <div className="flex-1 flex items-center">
              <h3 className="text-lg font-bold leading-tight line-clamp-3">
                {product.name}
              </h3>
            </div>

            <div className="mt-2">
              <Barcode 
                value={product.sku || product.id.substring(0, 8)} 
                height={30} 
                width={1.5}
                fontSize={10}
                margin={0}
                displayValue={true}
              />
            </div>
          </div>

          {/* Right Side - Price */}
          <div className="w-[140px] bg-yellow-400 flex items-center justify-center p-2 relative">
            <div className="text-center">
              <span className="block text-4xl font-bold tracking-tighter">
                {formatCurrency(product.price)}
              </span>
            </div>
            {/* Decorative triangle/cutout effect if desired, keeping it simple for now */}
          </div>
        </div>
      </div>

      <Button onClick={handleDownload} disabled={isGenerating} size="sm" className="w-full">
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
