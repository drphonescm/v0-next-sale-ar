import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    console.log("[v0] Registration request received")
    const body = await request.json()
    const { name, email, password, companyName } = body

    console.log("[v0] Registration data:", { name, email, companyName })

    if (!name || !email || !password || !companyName) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Check if user already exists
    console.log("[v0] Checking if user exists...")
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log("[v0] User already exists")
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 })
    }

    // Hash password
    console.log("[v0] Hashing password...")
    const passwordHash = await hashPassword(password)
    console.log("[v0] Password hashed successfully")

    // Create company and user in a transaction
    console.log("[v0] Creating company and user...")
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: companyName },
      })
      console.log("[v0] Company created:", company.id)

      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          companyId: company.id,
        },
      })
      console.log("[v0] User created:", user.id)

      return { user, company }
    })

    console.log("[v0] Registration successful")
    return NextResponse.json({
      ok: true,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
    })
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json(
      {
        error: "Error al registrar usuario",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
