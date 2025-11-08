import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCompanyId } from "@/lib/session"

// GET /api/products - List all products
export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId()

    const products = await db.product.findMany({
      where: { companyId },
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error("[v0] Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const companyId = await getCompanyId()
    const body = await request.json()

    const { sku, name, categoryId, supplierId, costPrice, price, stock, stockIdeal, stockMinimo, imageUrl } = body

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
    console.error("[v0] Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
