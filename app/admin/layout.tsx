"use client"

import type React from "react"
import { useEffect } from "react"
import { SessionProvider, useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
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
import { LayoutDashboardIcon, TicketIcon, UsersIcon, CreditCardIcon, FileTextIcon, LogOutIcon, SettingsIcon } from 'lucide-react'
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import Image from "next/image"
import { ADMIN_EMAIL } from "@/lib/utils"

function AdminDashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && session?.user?.email !== ADMIN_EMAIL) {
      router.push("/dashboard")
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.email !== ADMIN_EMAIL) {
    return null
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar>
        <SidebarHeader>
          <div className="flex flex-col items-center gap-2 px-2 py-3">
            <div className="flex items-center justify-center">
              <Image src="/logo.png" alt="Logo" width={60} height={60} className="object-contain" />
            </div>
            <span className="text-center text-sm font-semibold">Administrador</span>
          </div>
        </SidebarHeader>

        <Separator className="my-1" />

        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Panel Principal">
                <Link href="/admin">
                  <LayoutDashboardIcon />
                  <span>Panel Principal</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Cupones">
                <Link href="/admin/coupons">
                  <TicketIcon />
                  <span>Cupones</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Usuarios">
                <Link href="/admin/users">
                  <UsersIcon />
                  <span>Usuarios</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Suscripciones">
                <Link href="/admin/subscriptions">
                  <CreditCardIcon />
                  <span>Suscripciones</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Logs del Sistema">
                <Link href="/admin/logs">
                  <FileTextIcon />
                  <span>Logs del Sistema</span>
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
          <h1 className="text-base font-semibold">Panel de Administración</h1>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-2 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <AdminDashboardContent>{children}</AdminDashboardContent>
    </SessionProvider>
  )
}
