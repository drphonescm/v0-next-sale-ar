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

interface DeleteProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: any
  onSuccess: () => void
}

export function DeleteProductDialog({ open, onOpenChange, product, onSuccess }: DeleteProductDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!product) return

    setLoading(true)
    console.log("[v0] Intentando eliminar producto:", product.id)

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      })

      console.log("[v0] Response status:", response.status)
      const data = await response.json()
      console.log("[v0] Response data:", data)

      if (!response.ok) {
        console.error("[v0] Error en respuesta:", data.error)
        alert(data.error || "Error al eliminar producto. Por favor intenta de nuevo.")
        setLoading(false)
        return
      }

      console.log("[v0] Producto eliminado exitosamente")
      onSuccess()
    } catch (error) {
      console.error("[v0] Error eliminando producto:", error)
      alert("Error al eliminar producto. Por favor intenta de nuevo.")
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Producto</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que quieres eliminar <span className="font-semibold">{product?.name}</span>? Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {loading && <Spinner />}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
