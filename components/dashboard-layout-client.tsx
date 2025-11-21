"use client"

import type React from "react"
import { SessionProvider } from "next-auth/react"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  PackageIcon,
  UsersIcon,
  ShoppingCartIcon,
  WalletIcon,
  LogOutIcon,
  BarChart3Icon,
  SettingsIcon,
  ClockIcon,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { BlockedOverlayWrapper } from "@/components/blocked-overlay-wrapper"
import type { Session } from "next-auth"

interface DashboardLayoutClientProps {
  children: React.ReactNode
  session: Session
  isBlocked: boolean
  isGrace: boolean
}

export function DashboardLayoutClient({ children, session, isBlocked, isGrace }: DashboardLayoutClientProps) {
  return (
    <SessionProvider session={session} refetchInterval={0} refetchOnWindowFocus={false}>
      <SidebarProvider defaultOpen={true}>
        <Sidebar>
          <SidebarHeader>
            <div className="flex flex-col items-center gap-2 px-2 py-3">
              <div className="flex items-center justify-center">
                <Image src="/logo.png" alt="Logo" width={60} height={60} className="object-contain" />
              </div>
              <span className="text-center text-sm font-semibold">
                {(session.user as any)?.companyName || "Mi Empresa"}
              </span>
            </div>
          </SidebarHeader>

          <Separator className="my-1" />

          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Panel">
                  <Link href="/dashboard">
                    <LayoutDashboardIcon />
                    <span>Panel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Ventas">
                  <Link href="/dashboard/sales">
                    <ShoppingCartIcon />
                    <span>Ventas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Caja">
                  <Link href="/dashboard/cash">
                    <WalletIcon />
                    <span>Caja</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Productos">
                  <Link href="/dashboard/products">
                    <PackageIcon />
                    <span>Productos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Clientes">
                  <Link href="/dashboard/customers">
                    <UsersIcon />
                    <span>Clientes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Reportes">
                  <Link href="/dashboard/reports">
                    <BarChart3Icon />
                    <span>Reportes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Historial">
                  <Link href="/dashboard/historial">
                    <ClockIcon />
                    <span>Historial</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Ajustes">
                  <Link href="/dashboard/settings">
                    <SettingsIcon />
                    <span>Ajustes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Suscripción">
                  <Link href="/dashboard/subscription">
                    <WalletIcon />
                    <span>Suscripción</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Cerrar Sesión">
                  <Link href="/api/auth/signout">
                    <LogOutIcon />
                    <span>Cerrar Sesión</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b bg-background px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
            <h1 className="text-base font-semibold">Sistema de Gestión de Ventas</h1>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </header>

          {isGrace && (
            <div
              className="bg-yellow-50 dark:bg-yellow-950 border-l-4 border-yellow-500 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 p-4 mb-4 mx-4 flex justify-between items-center"
              role="alert"
            >
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <div>
                  <p className="font-bold">Tu suscripción está vencida.</p>
                  <p className="text-sm">Tenés 7 días para renovarla antes de perder el acceso.</p>
                </div>
              </div>
              <Link
                href="/dashboard/subscription"
                className="bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                Renovar Ahora
              </Link>
            </div>
          )}

          <BlockedOverlayWrapper isBlocked={isBlocked}>
            <div className="flex flex-1 flex-col gap-2 p-2">{children}</div>
          </BlockedOverlayWrapper>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  )
}
