"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeftIcon, UserPlusIcon } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"
import { toast } from "react-toastify"

export default function NewCustomerPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    creditLimit: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          creditLimit: formData.creditLimit ? Number.parseFloat(formData.creditLimit) : 0,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create customer")
      }

      toast.success(t("customerCreatedSuccessfully"))
      router.push("/dashboard/customers")
    } catch (error) {
      console.error("[v0] Error creating customer:", error)
      toast.error(t("failedToCreateCustomer"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/customers">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-lg font-bold">{t("addCustomer")}</h2>
          <p className="text-xs text-muted-foreground">{t("createNewCustomer")}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlusIcon className="h-4 w-4" />
            {t("customerInformation")}
          </CardTitle>
          <CardDescription className="text-xs">{t("enterCustomerDetails")}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-1.5">
              <Label htmlFor="name" className="text-xs">
                {t("name")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder={t("customerName")}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-9 text-sm"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="email" className="text-xs">
                {t("email")} ({t("optional")})
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-9 text-sm"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="phone" className="text-xs">
                {t("phone")} ({t("optional")})
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+54 11 1234-5678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-9 text-sm"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="creditLimit" className="text-xs">
                {t("creditLimit")} ({t("optional")})
              </Label>
              <Input
                id="creditLimit"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                className="h-9 text-sm"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading} className="flex-1 h-9 text-sm">
                {loading && <Spinner className="mr-2 h-3 w-3" />}
                {t("createCustomer")}
              </Button>
              <Link href="/dashboard/customers" className="flex-1">
                <Button type="button" variant="outline" className="w-full h-9 text-sm bg-transparent">
                  {t("cancel")}
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
