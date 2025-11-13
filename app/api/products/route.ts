import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId()

    const products = await db.product.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const companyId = await getCompanyId()
    const body = await request.json()

    let { sku, name, categoryId, supplierId, costPrice, price, stock, stockIdeal, stockMinimo, imageUrl } = body

    if (sku && sku.trim()) {
      const existingProduct = await db.product.findFirst({
        where: {
          sku: sku.trim(),
          companyId,
          deletedAt: null,
        },
      })

      if (existingProduct) {
        return NextResponse.json({ error: "El código SKU ya está en uso por otro producto" }, { status: 400 })
      }
    }

    if (!sku || !sku.trim()) {
      const lastProduct = await db.product.findFirst({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        select: { sku: true },
      })

      let nextNumber = 1
      if (lastProduct?.sku) {
        const match = lastProduct.sku.match(/\d+/)
        if (match) {
          nextNumber = Number.parseInt(match[0]) + 1
        }
      }

      sku = nextNumber.toString().padStart(8, "0")
    }

    const newProduct = await db.product.create({
      data: {
        sku,
        name,
        categoryId: categoryId || null,
        supplierId: supplierId || null,
        costPrice: Number.parseFloat(costPrice),
        price: Number.parseFloat(price),
        stock: Number.parseInt(stock),
        stockIdeal: stockIdeal ? Number.parseInt(stockIdeal) : null,
        stockMinimo: stockMinimo ? Number.parseInt(stockMinimo) : null,
        imageUrl: imageUrl || null,
        companyId,
      },
    })

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
