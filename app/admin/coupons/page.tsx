"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Trash2, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

interface Coupon {
  id: string
  code: string
  type: string
  status: string
  usedBy: string | null
  createdAt: string
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [newCoupon, setNewCoupon] = useState({ code: "", type: "MONTHLY" })
  const [generating, setGenerating] = useState(false)
  const router = useRouter()

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons")
      if (res.ok) {
        const data = await res.json()
        setCoupons(data)
      }
    } catch (error) {
      console.error("Error fetching coupons:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const handleGenerateCoupon = async (type: string) => {
    setGenerating(true)
    try {
      const res = await fetch("/api/admin/coupons/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })

      if (res.ok) {
        const data = await res.json()
        alert(
          `¡Cupón generado exitosamente!\n\nCódigo: ${data.code}\nTipo: ${type === "MONTHLY" ? "Mensual" : "Anual"}`,
        )
        fetchCoupons()
      } else {
        const error = await res.text()
        alert(`Error: ${error}`)
      }
    } catch (error) {
      console.error("Error generating coupon:", error)
      alert("Error generando cupón")
    } finally {
      setGenerating(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCoupon),
      })

      if (res.ok) {
        setNewCoupon({ code: "", type: "MONTHLY" })
        setIsCreating(false)
        setManualMode(false)
        fetchCoupons()
      } else {
        alert("Error creating coupon")
      }
    } catch (error) {
      console.error("Error creating coupon:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cupón?")) return

    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchCoupons()
      }
    } catch (error) {
      console.error("Error deleting coupon:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Cupones</h2>
          <p className="text-muted-foreground">Crea y administra cupones de acceso.</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cupón
        </button>
      </div>

      {isCreating && (
        <div className="border rounded-lg p-6 bg-muted/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Crear Cupón</h3>
            <button
              onClick={() => setManualMode(!manualMode)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {manualMode ? "Cambiar a Auto-generación" : "Modo Manual"}
            </button>
          </div>

          {!manualMode ? (
            // Auto-generate mode
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Genera códigos únicos automáticamente para cada tipo de suscripción.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleGenerateCoupon("MONTHLY")}
                  disabled={generating}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="h-8 w-8 mb-2 text-primary" />
                  <span className="font-medium">Generar Cupón Mensual</span>
                  <span className="text-xs text-muted-foreground mt-1">Código automático</span>
                </button>
                <button
                  onClick={() => handleGenerateCoupon("ANNUAL")}
                  disabled={generating}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="h-8 w-8 mb-2 text-primary" />
                  <span className="font-medium">Generar Cupón Anual</span>
                  <span className="text-xs text-muted-foreground mt-1">Código automático</span>
                </button>
              </div>
            </div>
          ) : (
            // Manual mode
            <form onSubmit={handleCreate} className="flex gap-4 items-end">
              <div className="grid gap-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Código
                </label>
                <input
                  id="code"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-[200px]"
                  placeholder="EJ: PROMO2024"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="type" className="text-sm font-medium">
                  Tipo de Plan
                </label>
                <select
                  id="type"
                  value={newCoupon.type}
                  onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-[200px]"
                >
                  <option value="MONTHLY">Mensual</option>
                  <option value="ANNUAL">Anual</option>
                </select>
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Crear
              </button>
            </form>
          )}
        </div>
      )}

      <div className="border rounded-md">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Código</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tipo</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Usado Por</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Creado</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center">
                    Cargando...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center text-muted-foreground">
                    No hay cupones creados.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle font-medium">{coupon.code}</td>
                    <td className="p-4 align-middle">
                      {coupon.type === "MONTHLY" ? (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                          Mensual
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                          Anual
                        </span>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      {coupon.status === "active" ? (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700">
                          Usado
                        </span>
                      )}
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">{coupon.usedBy || "-"}</td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {new Date(coupon.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 align-middle text-right">
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
