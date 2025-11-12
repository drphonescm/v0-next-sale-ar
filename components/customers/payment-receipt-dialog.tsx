"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { DollarSignIcon, ReceiptIcon } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

interface PaymentReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: {
    id: string
    name: string
    currentDebt: number
  }
  onPaymentSuccess: () => void
}

export function PaymentReceiptDialog({ open, onOpenChange, customer, onPaymentSuccess }: PaymentReceiptDialogProps) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value)
  }

  const handleSubmit = async () => {
    const paymentAmount = Number.parseFloat(amount)

    if (!paymentAmount || paymentAmount <= 0) {
      toast.error("El monto debe ser mayor a 0")
      return
    }

    if (paymentAmount > customer.currentDebt) {
      toast.error("El monto no puede ser mayor a la deuda actual")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/customers/${customer.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: paymentAmount,
          note: note || `Pago de cuenta corriente - ${customer.name}`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to register payment")
      }

      toast.success("Pago registrado exitosamente")
      onPaymentSuccess()
      onOpenChange(false)
      setAmount("")
      setNote("")
    } catch (error) {
      console.error("Error registering payment:", error)
      toast.error(error instanceof Error ? error.message : "Error al registrar el pago")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptIcon className="size-5" />
            {t("registerPayment")}
          </DialogTitle>
          <DialogDescription>Registrar pago de cuenta corriente para {customer.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {customer.currentDebt <= 0 ? (
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">Este cliente no tiene deuda pendiente</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("currentDebt")}:</span>
                  <span className="text-lg font-semibold">{formatCurrency(customer.currentDebt)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Monto del Pago *</Label>
                <div className="relative">
                  <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={customer.currentDebt}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Máximo: {formatCurrency(customer.currentDebt)}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Nota (Opcional)</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Detalles adicionales del pago..."
                  rows={3}
                />
              </div>

              {amount && Number.parseFloat(amount) > 0 && (
                <div className="rounded-lg bg-primary/10 p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Deuda después del pago:</span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(customer.currentDebt - Number.parseFloat(amount))}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <ReceiptIcon className="size-4" />
            {isSubmitting ? "Registrando..." : "Registrar Pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
