"use client"

import { useState, useEffect } from "react"
import { Check, CreditCard, Tag, AlertTriangle, Clock, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [data, setData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => console.error(err))
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
        window.location.reload()
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

  const sub = data?.subscription
  const isBlocked = sub?.status === "BLOCKED"
  const isGrace = sub?.status === "GRACE"
  
  const daysRemaining = sub?.endDate 
    ? Math.ceil((new Date(sub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Suscripción y Pagos</h1>
        <p className="text-muted-foreground">Gestiona tu plan y revisa tu historial</p>
      </div>

      {isBlocked && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Servicio Bloqueado</AlertTitle>
          <AlertDescription>
            Tu suscripción ha vencido y el periodo de gracia ha terminado. 
            Por favor realiza el pago para reactivar el acceso al sistema.
          </AlertDescription>
        </Alert>
      )}

      {isGrace && (
        <Alert className="border-yellow-500 text-yellow-600 bg-yellow-50">
          <Clock className="h-4 w-4" />
          <AlertTitle>Periodo de Gracia</AlertTitle>
          <AlertDescription>
            Tu suscripción ha vencido. Tienes acceso limitado por unos días. 
            Evita el bloqueo realizando el pago ahora.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Estado Actual</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Plan</div>
            <div className="text-lg font-bold">{sub?.plan === "ANNUAL" ? "Anual" : sub?.plan === "MONTHLY" ? "Mensual" : "Ninguno"}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Estado</div>
            <Badge variant={sub?.status === "ACTIVE" ? "default" : "destructive"}>
              {sub?.status || "Inactivo"}
            </Badge>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Vence el</div>
            <div className="text-lg font-bold">{sub?.endDate ? new Date(sub.endDate).toLocaleDateString("es-AR") : "-"}</div>
            {daysRemaining > 0 && sub?.status === "ACTIVE" && (
              <div className="text-xs text-muted-foreground mt-1">
                {daysRemaining} {daysRemaining === 1 ? "día restante" : "días restantes"}
              </div>
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Deuda</div>
            <div className={`text-lg font-bold ${isBlocked || isGrace ? "text-red-500" : "text-green-500"}`}>
              {isBlocked || isGrace ? "$29.000" : "$0"}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Monthly Plan */}
        <div className="border rounded-xl p-6 space-y-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Plan Mensual</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">$29.000</span>
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
            {sub?.plan === "MONTHLY" && sub?.status === "ACTIVE" ? "Extender Plan" : "Suscribirse Mensual"}
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
              <span className="text-4xl font-bold">$275.000</span>
              <span className="text-muted-foreground">/año</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Antes <span className="line-through">$348.000</span> al año
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
            {sub?.plan === "ANNUAL" && sub?.status === "ACTIVE" ? "Extender Plan" : "Suscribirse Anual"}
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

      {/* Historial de Cupones Canjeados y Pagos */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Historial de Cupones Canjeados */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Cupones Canjeados
          </h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.usedCoupons?.length > 0 ? (
                  data.usedCoupons.map((coupon: any) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {coupon.type === "MONTHLY" ? "Mensual (30 días)" : "Anual (365 días)"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(coupon.createdAt).toLocaleDateString("es-AR")}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No has canjeado cupones aún
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Historial de Pagos */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historial de Actividad
          </h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.history?.length > 0 ? (
                  data.history.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">{new Date(log.timestamp).toLocaleDateString("es-AR")}</TableCell>
                      <TableCell className="text-sm">{log.details}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No hay actividad registrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  )
}
