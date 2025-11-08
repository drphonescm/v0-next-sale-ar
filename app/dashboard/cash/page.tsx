"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrashIcon, WalletIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon } from "lucide-react"
import { AddCashMovementDialog } from "@/components/cash/add-cash-movement-dialog"
import { DeleteCashMovementDialog } from "@/components/cash/delete-cash-movement-dialog"
import { useTranslation } from "@/hooks/use-translation"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function CashFlowPage() {
  const { data, error, mutate } = useSWR("/api/cash", fetcher)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<any>(null)
  const [movementType, setMovementType] = useState<"in" | "out">("in")
  const { t } = useTranslation()

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

  const handleAddIncome = () => {
    setMovementType("in")
    setAddDialogOpen(true)
  }

  const handleAddExpense = () => {
    setMovementType("out")
    setAddDialogOpen(true)
  }

  const handleDelete = (movement: any) => {
    setSelectedMovement(movement)
    setDeleteDialogOpen(true)
  }

  const handleSuccess = () => {
    mutate()
    setAddDialogOpen(false)
    setDeleteDialogOpen(false)
    setSelectedMovement(null)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">{t("failedToLoadCashFlow")}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t("loadingCashFlow")}</p>
      </div>
    )
  }

  const { movements, balance } = data

  const incomeMovements = movements.filter((m: any) => m.type === "in")
  const expenseMovements = movements.filter((m: any) => m.type === "out")

  const totalIncome = incomeMovements.reduce((sum: number, m: any) => sum + m.amount, 0)
  const totalExpenses = expenseMovements.reduce((sum: number, m: any) => sum + m.amount, 0)

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("cashFlow")}</h2>
          <p className="text-muted-foreground">{t("trackIncomeExpenses")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAddExpense}>
            <TrendingDownIcon />
            {t("addExpense")}
          </Button>
          <Button onClick={handleAddIncome}>
            <TrendingUpIcon />
            {t("addIncome")}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("currentBalance")}</CardTitle>
            <WalletIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(balance)}
            </div>
            <p className="text-xs text-muted-foreground">{t("totalCashOnHand")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("totalIncome")}</CardTitle>
            <TrendingUpIcon className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">
              {incomeMovements.length} {t("transactions")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("totalExpenses")}</CardTitle>
            <TrendingDownIcon className="size-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {expenseMovements.length} {t("transactions")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSignIcon className="size-5" />
            {t("cashMovements")}
          </CardTitle>
          <CardDescription>{t("viewAllTransactions")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">{t("all")}</TabsTrigger>
              <TabsTrigger value="income">{t("income")}</TabsTrigger>
              <TabsTrigger value="expenses">{t("expenses")}</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {movements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <WalletIcon className="size-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t("noMovementsYet")}</h3>
                  <p className="text-muted-foreground mb-4">{t("startTrackingCashFlow")}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleAddExpense}>
                      <TrendingDownIcon />
                      {t("addExpense")}
                    </Button>
                    <Button onClick={handleAddIncome}>
                      <TrendingUpIcon />
                      {t("addIncome")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("type")}</TableHead>
                      <TableHead>{t("amount")}</TableHead>
                      <TableHead>{t("note")}</TableHead>
                      <TableHead>{t("date")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement: any) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <Badge variant={movement.type === "in" ? "default" : "secondary"}>
                            {movement.type === "in" ? (
                              <>
                                <TrendingUpIcon className="size-3" />
                                {t("income")}
                              </>
                            ) : (
                              <>
                                <TrendingDownIcon className="size-3" />
                                {t("expense")}
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`font-semibold ${movement.type === "in" ? "text-green-600" : "text-red-600"}`}
                        >
                          {movement.type === "in" ? "+" : "-"}
                          {formatCurrency(movement.amount)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{movement.note || t("noNote")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(movement.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(movement)}>
                            <TrashIcon />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="income" className="mt-4">
              {incomeMovements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <TrendingUpIcon className="size-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t("noIncomeRecorded")}</h3>
                  <p className="text-muted-foreground mb-4">{t("addFirstIncomeTransaction")}</p>
                  <Button onClick={handleAddIncome}>
                    <TrendingUpIcon />
                    {t("addIncome")}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("amount")}</TableHead>
                      <TableHead>{t("note")}</TableHead>
                      <TableHead>{t("date")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeMovements.map((movement: any) => (
                      <TableRow key={movement.id}>
                        <TableCell className="font-semibold text-green-600">
                          +{formatCurrency(movement.amount)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{movement.note || t("noNote")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(movement.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(movement)}>
                            <TrashIcon />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="expenses" className="mt-4">
              {expenseMovements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <TrendingDownIcon className="size-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t("noExpensesRecorded")}</h3>
                  <p className="text-muted-foreground mb-4">{t("addFirstExpenseTransaction")}</p>
                  <Button variant="outline" onClick={handleAddExpense}>
                    <TrendingDownIcon />
                    {t("addExpense")}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("amount")}</TableHead>
                      <TableHead>{t("note")}</TableHead>
                      <TableHead>{t("date")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseMovements.map((movement: any) => (
                      <TableRow key={movement.id}>
                        <TableCell className="font-semibold text-red-600">-{formatCurrency(movement.amount)}</TableCell>
                        <TableCell className="max-w-xs truncate">{movement.note || t("noNote")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(movement.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(movement)}>
                            <TrashIcon />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AddCashMovementDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        type={movementType}
        onSuccess={handleSuccess}
      />

      <DeleteCashMovementDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        movement={selectedMovement}
        onSuccess={handleSuccess}
      />
    </>
  )
}
