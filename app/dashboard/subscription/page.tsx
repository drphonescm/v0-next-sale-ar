"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Check, CreditCard, Tag, AlertTriangle, Clock, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  const isBlocked = sub?.status === "blocked"
  const isGrace = sub?.status === "grace"
  const isActive = sub?.status === "active"

  const canPay = isBlocked || isGrace

  const daysRemaining = sub?.endDate
    ? Math.ceil((new Date(sub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      <div className="text-center space-y-3 pb-4">
        <h1 className="text-4xl font-bold tracking-tight">Suscripción y Pagos</h1>
        <p className="text-lg text-muted-foreground">Gestiona tu plan, canjea cupones y revisa tu historial</p>
      </div>

      {isBlocked && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Servicio Bloqueado</AlertTitle>
          <AlertDescription>
            Tu suscripción ha vencido y el periodo de gracia ha terminado. Por favor realiza el pago para reactivar el
            acceso al sistema.
          </AlertDescription>
        </Alert>
      )}

      {isGrace && (
        <Alert className="border-yellow-500 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-950">
          <Clock className="h-4 w-4" />
          <AlertTitle>Periodo de Gracia</AlertTitle>
          <AlertDescription>
            Tu suscripción ha vencido. Tienes acceso limitado por unos días. Evita el bloqueo realizando el pago ahora.
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Estado Actual de Suscripción</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Plan</div>
            <div className="text-lg font-bold">
              {sub?.plan === "ANNUAL" ? "Anual" : sub?.plan === "MONTHLY" ? "Mensual" : "Ninguno"}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Estado</div>
            <Badge variant={isActive ? "default" : isGrace ? "outline" : "destructive"}>
              {isActive ? "Activo" : isGrace ? "Periodo de Gracia" : isBlocked ? "Bloqueado" : "Inactivo"}
            </Badge>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Vence el</div>
            <div className="text-lg font-bold">
              {sub?.endDate ? new Date(sub.endDate).toLocaleDateString("es-AR") : "-"}
            </div>
            {daysRemaining > 0 && isActive && (
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

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Planes Disponibles</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Plan */}
          <div className="border rounded-xl p-8 space-y-6 shadow-md hover:shadow-lg transition-all relative overflow-hidden bg-card">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Plan Mensual</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">$29.000</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
              <p className="text-sm text-muted-foreground">Ideal para comenzar</p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" /> Acceso completo al sistema
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" /> Soporte prioritario
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" /> Actualizaciones incluidas
              </li>
            </ul>
            <button
              onClick={() => handleMercadoPago("MONTHLY")}
              disabled={loading || !canPay}
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 py-2"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {isActive ? "Suscripción Activa" : "Suscribirse Mensual"}
            </button>
          </div>

          {/* Annual Plan */}
          <div className="border rounded-xl p-8 space-y-6 shadow-md hover:shadow-lg transition-all relative overflow-hidden border-primary/30 bg-primary/5">
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
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" /> Todo lo del plan mensual
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" /> 2 meses gratis
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" /> Consultoría inicial
              </li>
            </ul>
            <button
              onClick={() => handleMercadoPago("ANNUAL")}
              disabled={loading || !canPay}
              className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 py-2"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {isActive ? "Suscripción Activa" : "Suscribirse Anual"}
            </button>
          </div>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Tag className="h-6 w-6" />
            ¿Tienes un cupón de descuento?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRedeemCoupon} className="flex gap-3 max-w-2xl">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Ingresa tu código de cupón (ej: MES-1234-ABCD)"
              className="flex h-11 w-full rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !couponCode}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 py-2"
            >
              Canjear
            </button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Historial de Cupones Canjeados */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Tag className="h-6 w-6" />
              Cupones Canjeados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha de Canje</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.usedCoupons?.length > 0 ? (
                  data.usedCoupons.map((coupon: any) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-bold text-base">{coupon.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-sm">
                          {coupon.type === "MONTHLY" ? "Mensual (30 días)" : "Anual (365 días)"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(coupon.createdAt).toLocaleDateString("es-AR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Utilizado</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No has canjeado cupones aún
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Historial de Actividad */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Historial de Actividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.history?.length > 0 ? (
                  data.history.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm font-medium">
                        {new Date(log.timestamp).toLocaleDateString("es-AR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-sm">{log.details}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                      No hay actividad registrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
