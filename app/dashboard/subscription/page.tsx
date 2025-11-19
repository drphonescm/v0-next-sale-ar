"use client"

import { useState, useEffect } from "react"
import { Check, CreditCard, Tag } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [subscription, setSubscription] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Fetch current subscription
    // For now we just simulate or fetch if endpoint exists
    // I'll assume we might need an endpoint to get current sub, or pass it via server component
    // For simplicity in this step, I'll just show the selection UI
  }, [])

  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/subscription/redeem-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode }),
      })

      if (res.ok) {
        alert("¡Cupón canjeado con éxito! Tu suscripción está activa.")
        router.refresh()
        // Redirect or update state
      } else {
        const msg = await res.text()
        alert(`Error: ${msg}`)
      }
    } catch (error) {
      console.error(error)
      alert("Error al canjear cupón")
    } finally {
      setLoading(false)
    }
  }

  const handleMercadoPago = async (plan: "MONTHLY" | "ANNUAL") => {
    setLoading(true)
    try {
      const res = await fetch("/api/subscription/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
        }
      } else {
        alert("Error al iniciar pago")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Elige tu plan</h1>
        <p className="text-muted-foreground">Desbloquea todo el potencial de Next Sale ARG</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Monthly Plan */}
        <div className="border rounded-xl p-6 space-y-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Plan Mensual</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">$20</span>
              <span className="text-muted-foreground">/mes</span>
            </div>
            <p className="text-sm text-muted-foreground">Ideal para comenzar</p>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Acceso completo al sistema</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Soporte prioritario</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Actualizaciones incluidas</li>
          </ul>
          <button
            onClick={() => handleMercadoPago("MONTHLY")}
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Suscribirse Mensual
          </button>
        </div>

        {/* Annual Plan */}
        <div className="border rounded-xl p-6 space-y-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-primary/20 bg-primary/5">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-xl font-medium">
            AHORRA 20%
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Plan Anual</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">$190</span>
              <span className="text-muted-foreground">/año</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Antes <span className="line-through">$240</span> al año
            </p>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Todo lo del plan mensual</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 2 meses gratis</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Consultoría inicial</li>
          </ul>
          <button
            onClick={() => handleMercadoPago("ANNUAL")}
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Suscribirse Anual
          </button>
        </div>
      </div>

      {/* Coupon Section */}
      <div className="max-w-md mx-auto pt-8 border-t">
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Tag className="h-5 w-5" />
            ¿Tienes un cupón?
          </h3>
          <form onSubmit={handleRedeemCoupon} className="flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Ingresa tu código"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !couponCode}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
            >
              Canjear
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
