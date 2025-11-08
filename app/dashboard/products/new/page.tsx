"use client"

import type React from "react"
import useSWR from "swr"
import fetcher from "@/lib/fetcher"
import toast from "react-hot-toast"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeftIcon, PackageIcon, AlertCircleIcon } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/hooks/use-translation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function NewProductPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [lastChanged, setLastChanged] = useState<"costPrice" | "percentage" | "price" | null>(null)

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    categoryId: "",
    supplierId: "",
    costPrice: "",
    percentage: "",
    price: "",
    stock: "",
    stockIdeal: "",
    stockMinimo: "",
  })

  const { data: categories } = useSWR("/api/categories", fetcher)
  const { data: suppliers } = useSWR("/api/suppliers", fetcher)

  // 🧮 Calcular precio cuando cambian costo o porcentaje
  useEffect(() => {
    if (lastChanged === "costPrice" || lastChanged === "percentage") {
      const cost = Number.parseFloat(formData.costPrice)
      const percent = Number.parseFloat(formData.percentage)
      if (!isNaN(cost) && !isNaN(percent)) {
        const finalPrice = cost * (1 + percent / 100)
        setFormData((prev) => ({
          ...prev,
          price: finalPrice.toFixed(2),
        }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.costPrice, formData.percentage])

  // 🧮 Calcular porcentaje cuando cambia el precio
  useEffect(() => {
    if (lastChanged === "price") {
      const cost = Number.parseFloat(formData.costPrice)
      const price = Number.parseFloat(formData.price)
      if (!isNaN(cost) && !isNaN(price) && cost > 0) {
        const newPercent = ((price - cost) / cost) * 100
        setFormData((prev) => ({
          ...prev,
          percentage: newPercent.toFixed(2),
        }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.price])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (["costPrice", "percentage", "price"].includes(field)) setLastChanged(field as any)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const now = new Date()
      const formattedDate = now.toLocaleDateString("es-AR")
      const formattedTime = now.toLocaleTimeString("es-AR")

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: formData.sku.trim() || null,
          name: formData.name,
          categoryId: formData.categoryId || null,
          supplierId: formData.supplierId || null,
          costPrice: Number.parseFloat(formData.costPrice),
          price: Number.parseFloat(formData.price),
          stock: Number.parseInt(formData.stock),
          stockIdeal: formData.stockIdeal ? Number.parseInt(formData.stockIdeal) : null,
          stockMinimo: formData.stockMinimo ? Number.parseInt(formData.stockMinimo) : null,
          createdAt: `${formattedDate} ${formattedTime}`,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Producto creado exitosamente")
        setTimeout(() => {
          router.push("/dashboard/products")
        }, 500)
      } else {
        setError(data.error || t("failedToCreateProduct"))
        toast.error(data.error || t("failedToCreateProduct"))
      }
    } catch (error) {
      console.error("[v0] Error creating product:", error)
      const errorMessage = t("failedToCreateProduct")
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon />
            {t("backToProducts")}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageIcon className="size-5" />
            {t("addNewProduct")}
          </CardTitle>
          <CardDescription>{t("fillProductDetails")}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sku">
                {t("sku")} (código) ({t("optional")})
              </Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange("sku", e.target.value)}
                placeholder="00001"
              />
              <p className="text-xs text-muted-foreground">{t("skuAutoGenerate")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t("productName")} *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={t("enterProductName")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Rubro ({t("optional")})</Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleInputChange("categoryId", value)}>
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Seleccionar rubro" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierId">Proveedor ({t("optional")})</Label>
                <Select value={formData.supplierId} onValueChange={(value) => handleInputChange("supplierId", value)}>
                  <SelectTrigger id="supplierId">
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier: any) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice">{t("costPrice")} *</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  required
                  value={formData.costPrice}
                  onChange={(e) => handleInputChange("costPrice", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentage">{t("percentage")} *</Label>
                <div className="relative">
                  <Input
                    id="percentage"
                    type="number"
                    step="0.1"
                    required
                    value={formData.percentage}
                    onChange={(e) => handleInputChange("percentage", e.target.value)}
                    placeholder="30"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">{t("finalPrice")} *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">{t("currentStock")} *</Label>
                <Input
                  id="stock"
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => handleInputChange("stock", e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockIdeal">
                  {t("idealStock")} ({t("optional")})
                </Label>
                <Input
                  id="stockIdeal"
                  type="number"
                  value={formData.stockIdeal}
                  onChange={(e) => handleInputChange("stockIdeal", e.target.value)}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockMinimo">
                  {t("minimumStock")} ({t("optional")})
                </Label>
                <Input
                  id="stockMinimo"
                  type="number"
                  value={formData.stockMinimo}
                  onChange={(e) => handleInputChange("stockMinimo", e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t("creating") : t("createProduct")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
