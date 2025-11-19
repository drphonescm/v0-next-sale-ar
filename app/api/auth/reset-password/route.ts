import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcrypt-ts"

export async function POST(request: NextRequest) {
  try {
    const { email, token, password } = await request.json()

    console.log("[v0] Reset password request:", { email, hasToken: !!token, hasPassword: !!password })

    if (!email || !token || !password) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    const user = await db.user.findFirst({
      where: {
        email,
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    })

    console.log("[v0] User found:", !!user)

    if (!user) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 })
    }

    const hashedPassword = await hash(password, 10)

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    console.log("[v0] Password updated successfully")

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    })
  } catch (error) {
    console.error("[RESET_PASSWORD_ERROR]", error)
    return NextResponse.json(
      {
        error: "Error al restablecer la contraseña",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
