import Link from "next/link"
import Image from "next/image"
import { ShoppingCartIcon, PackageIcon, UsersIcon, WalletIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex-1" />
          <div className="flex items-center">
            <Image src="/logo.png" alt="Logo" width={64} height={64} className="object-contain" />
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button asChild variant="ghost">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Registrarse</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container flex flex-col items-center justify-center gap-4 py-24 md:py-32">
          <div className="flex max-w-[980px] flex-col items-center gap-4 text-center">
            <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
              Sistema de Gestión de Ventas Multi-Empresa
            </h1>
            <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
              Administra tus productos, clientes, ventas y flujo de caja en una sola plataforma. Diseñado para empresas
              argentinas.
            </p>
            <div className="flex gap-4">
              <Button asChild size="lg">
                <Link href="/register">Comenzar Gratis</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container py-12 md:py-24">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <PackageIcon className="size-10 text-primary" />
                <CardTitle>Productos</CardTitle>
                <CardDescription>Gestiona tu inventario con control de stock y precios</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <UsersIcon className="size-10 text-primary" />
                <CardTitle>Clientes</CardTitle>
                <CardDescription>Administra tu base de clientes y su información de contacto</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <ShoppingCartIcon className="size-10 text-primary" />
                <CardTitle>Ventas</CardTitle>
                <CardDescription>Crea ventas con múltiples items y comprobantes internos</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <WalletIcon className="size-10 text-primary" />
                <CardTitle>Caja</CardTitle>
                <CardDescription>Controla tus ingresos y egresos automáticamente</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex h-14 items-center justify-between">
          <p className="text-sm text-muted-foreground">© 2025 Next Sale AR. Sistema de ventas multi-empresa.</p>
        </div>
      </footer>
    </div>
  )
}
