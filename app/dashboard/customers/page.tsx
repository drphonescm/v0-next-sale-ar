"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon, MailIcon, PhoneIcon, SearchIcon } from "lucide-react"
import { DeleteCustomerDialog } from "@/components/customers/delete-customer-dialog"
import { useTranslation } from "@/hooks/use-translation"
import { useRouter } from "next/navigation"

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch")
    return res.json()
  })

export default function CustomersPage() {
  const { data: customers, error, mutate } = useSWR("/api/customers", fetcher)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { t } = useTranslation()
  const router = useRouter()

  const filteredCustomers = Array.isArray(customers)
    ? customers.filter((customer: any) => {
        if (!searchQuery) return true // Mostrar todos si no hay búsqueda
        const query = searchQuery.toLowerCase()
        return (
          customer.name.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query) ||
          customer.phone?.toLowerCase().includes(query)
        )
      })
    : []

  const handleEdit = (customer: any) => {
    router.push(`/dashboard/customers/${customer.id}`)
  }

  const handleDelete = (customer: any) => {
    setSelectedCustomer(customer)
    router.push(`/dashboard/customers/${customer.id}/delete`)
  }

  const handleAdd = () => {
    router.push("/dashboard/customers/new")
  }

  const handleSuccess = () => {
    mutate()
    setSelectedCustomer(null)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">{t("failedToLoadCustomers")}</p>
      </div>
    )
  }

  if (!customers || !Array.isArray(customers)) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t("loadingCustomers")}</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-bold">{t("customers")}</h2>
          <p className="text-xs text-muted-foreground">{t("manageCustomerDatabase")}</p>
        </div>
        <Button onClick={handleAdd} className="h-8 text-xs">
          <PlusIcon className="h-3 w-3" />
          {t("addCustomer")}
        </Button>
      </div>

      <Card>
        <CardHeader className="p-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <UsersIcon className="h-4 w-4" />
            {t("customerDirectory")}
          </CardTitle>
          <CardDescription className="text-xs">{t("viewManageCustomers")}</CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="mb-3">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t("searchCustomers")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <UsersIcon className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-sm font-semibold mb-1">{t("noCustomersFound")}</h3>
              <p className="text-xs text-muted-foreground mb-3">{t("tryDifferentSearch")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="text-xs">{t("name")}</TableHead>
                  <TableHead className="text-xs">{t("email")}</TableHead>
                  <TableHead className="text-xs">{t("phone")}</TableHead>
                  <TableHead className="text-xs">{t("joined")}</TableHead>
                  <TableHead className="text-right text-xs">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer: any) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/50 h-10"
                    onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                  >
                    <TableCell className="font-medium text-sm">{customer.name}</TableCell>
                    <TableCell>
                      {customer.email ? (
                        <div className="flex items-center gap-1.5">
                          <MailIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{customer.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">{t("noEmail")}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.phone ? (
                        <div className="flex items-center gap-1.5">
                          <PhoneIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{customer.phone}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">{t("noPhone")}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(customer)
                          }}
                          className="h-7 w-7"
                        >
                          <PencilIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(customer)
                          }}
                          className="h-7 w-7"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DeleteCustomerDialog
        open={false}
        onOpenChange={() => {}}
        customer={selectedCustomer}
        onSuccess={handleSuccess}
      />
    </>
  )
}
