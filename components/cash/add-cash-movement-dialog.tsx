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
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

interface AddCashMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "in" | "out"
  onSuccess: () => void
}

export function AddCashMovementDialog({ open, onOpenChange, type, onSuccess }: AddCashMovementDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: "",
    note: "",
  })

  useEffect(() => {
    if (open) {
      setFormData({
        amount: "",
        note: "",
      })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/cash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          amount: formData.amount,
          note: formData.note,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add cash movement")
      }

      onSuccess()
    } catch (error) {
      console.error("[v0] Error adding cash movement:", error)
      alert("Failed to add cash movement. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "in" ? (
              <>
                <TrendingUpIcon className="size-5 text-green-600" />
                Add Income
              </>
            ) : (
              <>
                <TrendingDownIcon className="size-5 text-red-600" />
                Add Expense
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {type === "in" ? "Record a cash income transaction" : "Record a cash expense transaction"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Add a description..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} variant={type === "in" ? "default" : "outline"}>
              {loading && <Spinner />}
              Add {type === "in" ? "Income" : "Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
