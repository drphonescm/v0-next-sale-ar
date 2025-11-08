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
import { Spinner } from "@/components/ui/spinner"

interface DeleteSaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale?: any
  onSuccess: () => void
}

export function DeleteSaleDialog({ open, onOpenChange, sale, onSuccess }: DeleteSaleDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!sale) return

    setLoading(true)

    try {
      const response = await fetch(`/api/sales/${sale.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete sale")
      }

      onSuccess()
    } catch (error) {
      console.error("[v0] Error deleting sale:", error)
      alert("Failed to delete sale. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Sale</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete sale <span className="font-semibold">#{sale?.internalNumber}</span>? This
            action cannot be undone and will restore the product stock.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {loading && <Spinner />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
