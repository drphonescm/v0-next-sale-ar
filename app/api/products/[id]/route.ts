import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"
import { createAuditLog, getSafeUserId } from "@/lib/audit-log"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId()
    const { id } = await params

    const product = await db.product.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        category: true,
        supplier: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId()
    const { id } = await params
    const body = await request.json()

    const { sku, name, categoryId, supplierId, costPrice, price, stock, stockIdeal, stockMinimo, imageUrl, status } =
      body

    const product = await db.product.findFirst({
      where: { id, companyId, deletedAt: null },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const updatedProduct = await db.product.update({
      where: { id },
      data: {
        ...(sku !== undefined && { sku }),
        ...(name !== undefined && { name }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(supplierId !== undefined && { supplierId: supplierId || null }),
        ...(costPrice !== undefined && { costPrice: Number.parseFloat(costPrice) }),
        ...(price !== undefined && { price: Number.parseFloat(price) }),
        ...(stock !== undefined && { stock: Number.parseInt(stock) }),
        ...(stockIdeal !== undefined && { stockIdeal: stockIdeal ? Number.parseInt(stockIdeal) : null }),
        ...(stockMinimo !== undefined && { stockMinimo: stockMinimo ? Number.parseInt(stockMinimo) : null }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(status !== undefined && { status }),
      },
      include: {
        category: true,
        supplier: true,
      },
    })

    const userId = await getSafeUserId()
    createAuditLog({
      companyId,
      userId,
      action: "UPDATE_PRODUCT",
      entityType: "PRODUCT",
      entityId: id,
      entityName: product.name,
      oldValues: product,
      newValues: updatedProduct,
      request,
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const companyId = await getCompanyId()

    const product = await db.product.findFirst({
      where: { id, companyId, deletedAt: null },
    })

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    await db.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: companyId,
        status: "discontinued",
      },
    })

    const userId = await getSafeUserId()
    createAuditLog({
      companyId,
      userId,
      action: "DELETE_PRODUCT",
      entityType: "PRODUCT",
      entityId: id,
      entityName: product.name,
      oldValues: product,
      request,
    })

    return NextResponse.json({ success: true, message: "Producto eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      {
        error: "Error al eliminar producto",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
