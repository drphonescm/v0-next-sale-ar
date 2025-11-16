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
import { LayoutDashboardIcon, PackageIcon, UsersIcon, ShoppingCartIcon, WalletIcon, LogOutIcon, BarChart3Icon, SettingsIcon, HistoryIcon } from 'lucide-react'
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTranslation } from "@/hooks/use-translation"
import Image from "next/image"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    )
  }

  if (!session) {
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
            <span className="text-center text-sm font-semibold">
              {(session.user as any)?.companyName || "Mi Empresa"}
            </span>
          </div>
        </SidebarHeader>

        <Separator className="my-1" />

        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("dashboard")}>
                <Link href="/dashboard">
                  <LayoutDashboardIcon />
                  <span>{t("dashboard")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("products")}>
                <Link href="/dashboard/products">
                  <PackageIcon />
                  <span>{t("products")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("customers")}>
                <Link href="/dashboard/customers">
                  <UsersIcon />
                  <span>{t("customers")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("sales")}>
                <Link href="/dashboard/sales">
                  <ShoppingCartIcon />
                  <span>{t("sales")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("cashFlow")}>
                <Link href="/dashboard/cash">
                  <WalletIcon />
                  <span>{t("cashFlow")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Historial">
                <Link href="/dashboard/historial">
                  <HistoryIcon />
                  <span>Historial</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("reports")}>
                <Link href="/dashboard/reports">
                  <BarChart3Icon />
                  <span>{t("reports")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("settings")}>
                <Link href="/dashboard/settings">
                  <SettingsIcon />
                  <span>{t("settings")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("logout")}>
                <Link href="/api/auth/signout">
                  <LogOutIcon />
                  <span>{t("logout")}</span>
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
          <h1 className="text-base font-semibold">{t("salesManagementSystem")}</h1>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-2 p-2">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  )
}
