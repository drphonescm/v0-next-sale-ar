import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId()
    const { id } = await params

    console.log("[v0] GET Product - ID:", id, "CompanyID:", companyId)

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
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("[v0] Error fetching product:", error)
    return NextResponse.json({ error: "Error al obtener producto" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId()
    const { id } = await params
    const body = await request.json()

    console.log("[v0] PUT Product - ID:", id, "Body:", body)

    const { sku, name, categoryId, supplierId, costPrice, price, stock, stockIdeal, stockMinimo, imageUrl } = body

    const product = await db.product.findFirst({
      where: { id, companyId, deletedAt: null },
    })

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
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

    console.log("[v0] Product updated successfully:", updatedProduct.id)
    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error("[v0] Error updating product:", error)
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = await getCompanyId()

    console.log("[v0] DELETE Product - ID:", id, "CompanyID:", companyId)

    const product = await db.product.findFirst({
      where: { id, companyId, deletedAt: null },
    })

    if (!product) {
      console.log("[v0] Product not found for deletion")
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    // Soft delete: solo marcamos deletedAt
    await db.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })

    console.log("[v0] Product soft deleted successfully")
    return NextResponse.json({ success: true, message: "Producto eliminado correctamente" })
  } catch (error) {
    console.error("[v0] Error deleting product:", error)
    return NextResponse.json(
      {
        error: "Error al eliminar producto",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
