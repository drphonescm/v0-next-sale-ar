"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusIcon, Pencil, Trash2, Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Category {
  id: string
  name: string
  description: string | null
}

interface Supplier {
  id: string
  name: string
  contactName: string | null
  phone: string | null
  email: string | null
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [companyCuit, setCompanyCuit] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isEditingCompany, setIsEditingCompany] = useState(false)
  const [isEditingLogo, setIsEditingLogo] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryName, setCategoryName] = useState("")
  const [categoryDescription, setCategoryDescription] = useState("")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierName, setSupplierName] = useState("")
  const [supplierContact, setSupplierContact] = useState("")
  const [supplierPhone, setSupplierPhone] = useState("")
  const [supplierEmail, setSupplierEmail] = useState("")
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchCategories()
    fetchSuppliers()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setCompanyName(data.name || "")
        setCompanyCuit(data.cuit || "")
        setLogoUrl(data.logoUrl || "")
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers")
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    }
  }

  const handleSaveCompanyInfo = async () => {
    if (!companyName.trim()) {
      toast.error("El nombre de la empresa es requerido")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: companyName,
          cuit: companyCuit 
        }),
      })

      if (!response.ok) throw new Error("Error al guardar información de empresa")

      toast.success("Información de empresa actualizada correctamente")
      setIsEditingCompany(false)
      fetchSettings()
    } catch (error) {
      console.error("Error saving company info:", error)
      toast.error("Error al guardar la información de la empresa")
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast.error("Por favor selecciona un archivo")
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", logoFile)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to upload logo")

      const { url } = await response.json()

      const settingsResponse = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: url }),
      })

      if (!settingsResponse.ok) throw new Error("Failed to save logo")

      setLogoUrl(url)
      setLogoFile(null)
      toast.success("Logo actualizado correctamente")
      setIsEditingLogo(false)
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast.error("Error al subir el logo")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      toast.error("El nombre de la categoría es requerido")
      return
    }

    setLoading(true)
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories"
      const method = editingCategory ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryName,
          description: categoryDescription,
        }),
      })

      if (!response.ok) throw new Error("Failed to save category")

      toast.success(editingCategory ? "Categoría actualizada" : "Categoría creada")
      setCategoryName("")
      setCategoryDescription("")
      setEditingCategory(null)
      setIsDialogOpen(false)
      fetchCategories()
    } catch (error) {
      console.error("Error saving category:", error)
      toast.error("Error al guardar la categoría")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete category")

      toast.success("Categoría eliminada")
      fetchCategories()
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("Error al eliminar la categoría")
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setCategoryDescription(category.description || "")
    setIsDialogOpen(true)
  }

  const handleSaveSupplier = async () => {
    if (!supplierName.trim()) {
      toast.error("El nombre del proveedor es requerido")
      return
    }

    setLoading(true)
    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : "/api/suppliers"
      const method = editingSupplier ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: supplierName,
          contactName: supplierContact || null,
          phone: supplierPhone || null,
          email: supplierEmail || null,
        }),
      })

      if (!response.ok) throw new Error("Failed to save supplier")

      toast.success(editingSupplier ? "Proveedor actualizado" : "Proveedor creado")
      setSupplierName("")
      setSupplierContact("")
      setSupplierPhone("")
      setSupplierEmail("")
      setEditingSupplier(null)
      setIsSupplierDialogOpen(false)
      fetchSuppliers()
    } catch (error) {
      console.error("Error saving supplier:", error)
      toast.error("Error al guardar el proveedor")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este proveedor?")) return

    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete supplier")

      toast.success("Proveedor eliminado")
      fetchSuppliers()
    } catch (error) {
      console.error("Error deleting supplier:", error)
      toast.error("Error al eliminar el proveedor")
    }
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setSupplierName(supplier.name)
    setSupplierContact(supplier.contactName || "")
    setSupplierPhone(supplier.phone || "")
    setSupplierEmail(supplier.email || "")
    setIsSupplierDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("settings")}</h1>
        <p className="text-muted-foreground">{t("manageSystemSettings")}</p>
      </div>

      <Tabs defaultValue="empresa" className="space-y-4">
        <TabsList>
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="categories">{t("categories")}</TabsTrigger>
          <TabsTrigger value="suppliers">{t("suppliers")}</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Información de la Empresa</CardTitle>
                  <CardDescription>Configura los datos de tu empresa</CardDescription>
                </div>
                {!isEditingCompany && (
                  <Button variant="outline" onClick={() => setIsEditingCompany(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEditingCompany ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Nombre de la Empresa</Label>
                    <p className="text-lg font-medium">{companyName || "No configurado"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">CUIT</Label>
                    <p className="text-lg font-medium">{companyCuit || "No configurado"}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nombre de la Empresa *</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ingresa el nombre de tu empresa"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyCuit">CUIT (Opcional)</Label>
                    <Input
                      id="companyCuit"
                      value={companyCuit}
                      onChange={(e) => setCompanyCuit(e.target.value)}
                      placeholder="XX-XXXXXXXX-X"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveCompanyInfo} disabled={loading}>
                      {loading ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditingCompany(false)
                        fetchSettings()
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Logo de la Empresa</CardTitle>
                  <CardDescription>Sube el logo que aparecerá en facturas y documentos</CardDescription>
                </div>
                {!isEditingLogo && (
                  <Button variant="outline" onClick={() => setIsEditingLogo(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Cambiar Logo
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center p-4 border rounded-lg bg-muted">
                {logoUrl ? (
                  <img src={logoUrl || "/placeholder.svg"} alt="Logo de la Empresa" className="max-h-32 object-contain" />
                ) : (
                  <p className="text-muted-foreground">No hay logo configurado</p>
                )}
              </div>

              {isEditingLogo && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="logo">Seleccionar Nuevo Logo</Label>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleLogoUpload} disabled={loading || !logoFile}>
                      <Upload className="mr-2 h-4 w-4" />
                      {loading ? "Subiendo..." : "Guardar Logo"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditingLogo(false)
                        setLogoFile(null)
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("productCategories")}</CardTitle>
                  <CardDescription>{t("manageCategoriesDescription")}</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingCategory(null)
                        setCategoryName("")
                        setCategoryDescription("")
                      }}
                    >
                      <PlusIcon className="mr-2 h-4 w-4" />
                      {t("newCategory")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingCategory ? t("editCategoryTitle") : t("newCategory")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoryName">{t("categoryNameLabel")}</Label>
                        <Input
                          id="categoryName"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          placeholder={t("categoryNamePlaceholder")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="categoryDescription">{t("categoryDescriptionLabel")}</Label>
                        <Textarea
                          id="categoryDescription"
                          value={categoryDescription}
                          onChange={(e) => setCategoryDescription(e.target.value)}
                          placeholder={t("categoryDescriptionPlaceholder")}
                        />
                      </div>
                      <Button onClick={handleSaveCategory} disabled={loading} className="w-full">
                        {loading ? t("saving") : t("save")}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("description")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        {t("noCategoriesCreated")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("suppliers")}</CardTitle>
                  <CardDescription>{t("manageSuppliersDescription")}</CardDescription>
                </div>
                <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingSupplier(null)
                        setSupplierName("")
                        setSupplierContact("")
                        setSupplierPhone("")
                        setSupplierEmail("")
                      }}
                    >
                      <PlusIcon className="mr-2 h-4 w-4" />
                      {t("newSupplier")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingSupplier ? t("editSupplierTitle") : t("newSupplier")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="supplierName">{t("supplierNameRequired")}</Label>
                        <Input
                          id="supplierName"
                          value={supplierName}
                          onChange={(e) => setSupplierName(e.target.value)}
                          placeholder={t("supplierNamePlaceholder")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplierContact">{t("contactPersonLabel")}</Label>
                        <Input
                          id="supplierContact"
                          value={supplierContact}
                          onChange={(e) => setSupplierContact(e.target.value)}
                          placeholder={t("contactPersonPlaceholder")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplierPhone">{t("phoneLabel")}</Label>
                        <Input
                          id="supplierPhone"
                          value={supplierPhone}
                          onChange={(e) => setSupplierPhone(e.target.value)}
                          placeholder={t("phonePlaceholder")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplierEmail">{t("emailLabel")}</Label>
                        <Input
                          id="supplierEmail"
                          type="email"
                          value={supplierEmail}
                          onChange={(e) => setSupplierEmail(e.target.value)}
                          placeholder={t("emailPlaceholder")}
                        />
                      </div>
                      <Button onClick={handleSaveSupplier} disabled={loading} className="w-full">
                        {loading ? t("saving") : t("save")}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("contact")}</TableHead>
                    <TableHead>{t("phone")}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {t("noSuppliersCreated")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.contactName || "-"}</TableCell>
                        <TableCell>{supplier.phone || "-"}</TableCell>
                        <TableCell>{supplier.email || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditSupplier(supplier)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSupplier(supplier.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
