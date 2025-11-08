"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "sonner"

interface SupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier?: any
  onSuccess: () => void
}

export function SupplierDialog({ open, onOpenChange, supplier, onSuccess }: SupplierDialogProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
  })

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        contactName: supplier.contactName || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
      })
    } else {
      setFormData({
        name: "",
        contactName: "",
        phone: "",
        email: "",
        address: "",
      })
    }
  }, [supplier, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = supplier ? `/api/suppliers/${supplier.id}` : "/api/suppliers"
      const method = supplier ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to save supplier")

      toast.success(supplier ? t("supplierUpdated") : t("supplierCreated"))
      onSuccess()
    } catch (error) {
      toast.error(supplier ? t("failedToUpdateSupplier") : t("failedToCreateSupplier"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{supplier ? t("editSupplier") : t("addSupplier")}</DialogTitle>
          <DialogDescription>{supplier ? t("updateSupplierDetails") : t("fillSupplierDetails")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("supplierName")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("enterSupplierName")}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactName">
                {t("contactName")} ({t("optional")})
              </Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder={t("enterContactName")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">
                {t("phone")} ({t("optional")})
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t("enterPhone")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">
                {t("email")} ({t("optional")})
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t("enterEmail")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">
                {t("address")} ({t("optional")})
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={t("enterAddress")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t(supplier ? "updating" : "creating") : t(supplier ? "updateSupplier" : "createSupplier")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
