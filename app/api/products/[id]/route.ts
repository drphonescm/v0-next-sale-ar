import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"
import { createAuditLog } from "@/lib/audit-log"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId()
    const { id } = params

    const product = await db.product.findFirst({
      where: {
        id,
        companyId,
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
    console.error("[v0] Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = await getCompanyId()
    const { id } = params
    const body = await request.json()

    const { sku, name, categoryId, supplierId, costPrice, price, stock, stockIdeal, stockMinimo, imageUrl } = body

    const product = await db.product.findFirst({
      where: { id, companyId },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const oldValues = {
      sku: product.sku,
      name: product.name,
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      costPrice: product.costPrice,
      price: product.price,
      stock: product.stock,
      stockIdeal: product.stockIdeal,
      stockMinimo: product.stockMinimo,
      imageUrl: product.imageUrl,
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
      },
      include: {
        category: true,
        supplier: true,
      },
    })

    await createAuditLog({
      companyId,
      action: "UPDATE",
      entityType: "Product",
      entityId: id,
      entityName: updatedProduct.name,
      oldValues,
      newValues: {
        sku: updatedProduct.sku,
        name: updatedProduct.name,
        categoryId: updatedProduct.categoryId,
        supplierId: updatedProduct.supplierId,
        costPrice: updatedProduct.costPrice,
        price: updatedProduct.price,
        stock: updatedProduct.stock,
        stockIdeal: updatedProduct.stockIdeal,
        stockMinimo: updatedProduct.stockMinimo,
        imageUrl: updatedProduct.imageUrl,
      },
      request,
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error("[v0] Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] === DELETE PRODUCT START ===")

    const { id } = params
    console.log("[v0] Product ID:", id)

    let companyId: string
    try {
      companyId = await getCompanyId()
      console.log("[v0] Company ID obtained:", companyId)
    } catch (error) {
      console.error("[v0] Error getting companyId:", error)
      return NextResponse.json({ error: "Error de autenticación" }, { status: 401 })
    }

    const product = await db.product.findFirst({
      where: { id, companyId },
    })

    console.log("[v0] Product found:", product ? `yes (${product.name})` : "no")

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    console.log("[v0] Nullifying sale items references...")
    const updateResult = await db.saleItem.updateMany({
      where: { productId: id },
      data: { productId: null },
    })
    console.log("[v0] Sale items updated:", updateResult.count)

    console.log("[v0] Deleting product from database...")
    await db.product.delete({
      where: { id },
    })
    console.log("[v0] Product deleted successfully!")

    await createAuditLog({
      companyId,
      action: "DELETE",
      entityType: "Product",
      entityId: id,
      entityName: product.name,
      oldValues: {
        sku: product.sku,
        name: product.name,
        categoryId: product.categoryId,
        supplierId: product.supplierId,
        costPrice: product.costPrice,
        price: product.price,
        stock: product.stock,
      },
      newValues: null,
      request,
    })

    console.log("[v0] === DELETE PRODUCT END (SUCCESS) ===")
    return NextResponse.json({ success: true, message: "Producto eliminado correctamente" })
  } catch (error) {
    console.error("[v0] === DELETE PRODUCT ERROR ===")
    console.error("[v0] Error details:", error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : "Unknown")
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "N/A")

    return NextResponse.json(
      {
        error: "Error al eliminar producto",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
