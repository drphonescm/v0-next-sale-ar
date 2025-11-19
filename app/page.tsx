import Link from "next/link"
import Image from "next/image"
import { ShoppingCartIcon, PackageIcon, UsersIcon, WalletIcon, CheckIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

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

        <section className="container py-12 md:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl">Planes Simples</h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Elige el plan que mejor se adapte a tu negocio. Sin costos ocultos.
            </p>
          </div>
          <div className="grid gap-8 py-8 md:grid-cols-2 lg:gap-12 max-w-[64rem] mx-auto">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl">Mensual</CardTitle>
                <CardDescription>Ideal para comenzar</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 flex-1">
                <div className="text-4xl font-bold">$20</div>
                <ul className="grid gap-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="size-4" /> Acceso completo al sistema
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="size-4" /> Usuarios ilimitados
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="size-4" /> Soporte prioritario
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/register">Comenzar Ahora</Link>
                </Button>
              </CardFooter>
            </Card>
            <Card className="flex flex-col border-primary relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">
                AHORRA 20%
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Anual</CardTitle>
                <CardDescription>Para negocios establecidos</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 flex-1">
                <div className="flex items-baseline gap-2">
                  <div className="text-4xl font-bold">$190</div>
                  <div className="text-lg text-muted-foreground line-through">$240</div>
                </div>
                <ul className="grid gap-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="size-4" /> Todo lo del plan mensual
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="size-4" /> 2 meses gratis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="size-4" /> Auditoría avanzada
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/register">Obtener Oferta</Link>
                </Button>
              </CardFooter>
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
