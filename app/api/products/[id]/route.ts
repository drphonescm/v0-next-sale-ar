import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

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

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const companyId = await getCompanyId()

    const product = await db.product.findFirst({
      where: { id, companyId },
    })

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    await db.saleItem.updateMany({
      where: { productId: id },
      data: { productId: null },
    })

    await db.product.delete({
      where: { id },
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
