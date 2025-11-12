"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeftIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  CreditCardIcon,
  ShoppingCartIcon,
  SaveIcon,
  PencilIcon,
  ReceiptIcon,
} from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { useState } from "react"
import { toast } from "sonner"
import { PaymentReceiptDialog } from "@/components/customers/payment-receipt-dialog"

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch")
    return res.json()
  })

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t } = useTranslation()
  const { data: customer, error, mutate } = useSWR(`/api/customers/${id}`, fetcher)

  const [isEditing, setIsEditing] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone: "",
    creditLimit: "",
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date))
  }

  const handleEdit = () => {
    setEditData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      creditLimit: customer.creditLimit?.toString() || "0",
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editData,
          creditLimit: editData.creditLimit ? Number.parseFloat(editData.creditLimit) : 0,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update customer")
      }

      toast.success("Cliente actualizado exitosamente")
      await mutate()
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating customer:", error)
      toast.error("Error al actualizar el cliente")
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      creditLimit: customer.creditLimit?.toString() || "0",
    })
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-destructive">{t("failedToLoadCustomer")}</p>
        <Button onClick={() => router.back()}>
          <ArrowLeftIcon />
          {t("goBack")}
        </Button>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t("loadingCustomer")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeftIcon />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{customer.name}</h2>
            <p className="text-muted-foreground">
              {t("customerSince")} {new Date(customer.createdAt).toLocaleDateString("es-AR")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPaymentDialogOpen(true)}
            disabled={!customer?.currentDebt || customer.currentDebt <= 0}
          >
            <ReceiptIcon />
            Recibo de Pago
          </Button>
          {!isEditing && (
            <Button onClick={handleEdit}>
              <PencilIcon />
              {t("editCustomer")}
            </Button>
          )}
        </div>
      </div>

      {/* Customer Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="size-5" />
            {t("customerInformation")}
          </CardTitle>
          <CardDescription>{t("viewEditCustomerDetails")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("name")} *</Label>
                  <Input
                    id="name"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    placeholder={t("customerName")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    placeholder={t("customerEmail")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input
                    id="phone"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    placeholder={t("customerPhone")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creditLimit">{t("creditLimit")}</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    step="0.01"
                    value={editData.creditLimit}
                    onChange={(e) => setEditData({ ...editData, creditLimit: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleCancel}>
                  {t("cancel")}
                </Button>
                <Button onClick={handleSave}>
                  <SaveIcon />
                  {t("saveChanges")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <UserIcon className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("name")}</p>
                    <p className="font-medium">{customer.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MailIcon className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("email")}</p>
                    <p className="font-medium">{customer.email || t("notSpecified")}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <PhoneIcon className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("phone")}</p>
                    <p className="font-medium">{customer.phone || t("notSpecified")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCardIcon className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("creditLimit")}</p>
                    <p className="font-medium text-lg">{formatCurrency(customer.creditLimit || 0)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCardIcon className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("currentDebt")}</p>
                    <p className="font-medium text-lg">{formatCurrency(customer.currentDebt || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Sales History */}
      <Tabs defaultValue="sales" className="w-full">
        <TabsList>
          <TabsTrigger value="sales">
            <ShoppingCartIcon className="size-4 mr-2" />
            {t("salesHistory")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("associatedSales")}</CardTitle>
              <CardDescription>{t("allSalesForCustomer")}</CardDescription>
            </CardHeader>
            <CardContent>
              {!customer.sales || customer.sales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingCartIcon className="size-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t("noSalesYet")}</h3>
                  <p className="text-muted-foreground">{t("customerHasNoSales")}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("orderNumber")}</TableHead>
                      <TableHead>{t("items")}</TableHead>
                      <TableHead>{t("total")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("date")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.sales.map((sale: any) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono font-medium">#{sale.internalNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {sale.items?.length || 0} {t("items")}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(sale.total)}</TableCell>
                        <TableCell>
                          <Badge variant={sale.status === "completed" ? "default" : "secondary"}>
                            {t(sale.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(sale.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Receipt Dialog */}
      {customer && (
        <PaymentReceiptDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          customer={{
            id: customer.id,
            name: customer.name,
            currentDebt: customer.currentDebt || 0,
          }}
          onPaymentSuccess={() => mutate()}
        />
      )}
    </div>
  )
}
