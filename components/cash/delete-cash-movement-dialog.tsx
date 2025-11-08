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

interface DeleteCashMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  movement?: any
  onSuccess: () => void
}

export function DeleteCashMovementDialog({ open, onOpenChange, movement, onSuccess }: DeleteCashMovementDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!movement) return

    setLoading(true)

    try {
      const response = await fetch(`/api/cash/${movement.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete cash movement")
      }

      onSuccess()
    } catch (error) {
      console.error("[v0] Error deleting cash movement:", error)
      alert("Failed to delete cash movement. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Cash Movement</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this {movement?.type === "in" ? "income" : "expense"} of{" "}
            <span className="font-semibold">{movement && formatCurrency(movement.amount)}</span>? This action cannot be
            undone.
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
