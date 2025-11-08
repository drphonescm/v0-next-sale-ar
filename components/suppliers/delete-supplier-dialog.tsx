"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "sonner"

interface DeleteSupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: any
  onSuccess: () => void
}

export function DeleteSupplierDialog({ open, onOpenChange, supplier, onSuccess }: DeleteSupplierDialogProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!supplier) return

    setLoading(true)
    try {
      const response = await fetch(`/api/suppliers/${supplier.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete supplier")

      toast.success(t("supplierDeleted"))
      onSuccess()
    } catch (error) {
      toast.error(t("failedToDeleteSupplier"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteSupplier")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("confirmDeleteSupplier")} <strong>{supplier?.name}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? t("deleting") : t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
