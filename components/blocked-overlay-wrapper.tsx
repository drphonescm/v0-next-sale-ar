"use client"

import { usePathname } from 'next/navigation'
import { Lock } from 'lucide-react'
import Link from "next/link"

export function BlockedOverlayWrapper({ 
  isBlocked, 
  children 
}: { 
  isBlocked: boolean
  children: React.ReactNode 
}) {
  const pathname = usePathname()
  const isSubscriptionPage = pathname === "/dashboard/subscription"

  if (isBlocked && !isSubscriptionPage) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-8 text-center space-y-6">
        <div className="bg-red-100 p-6 rounded-full">
          <Lock className="h-16 w-16 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-red-600">Acceso Bloqueado</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          No tienes una suscripción activa. Para acceder a los servicios del sistema, por favor realiza el pago de tu suscripción.
        </p>
        <Link 
          href="/dashboard/subscription" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
        >
          Ir a Pagos
        </Link>
      </div>
    )
  }

  return <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
}
