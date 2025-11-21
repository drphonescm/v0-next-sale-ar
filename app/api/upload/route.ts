import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Tipo de archivo no válido. Solo se permiten PNG, JPG, JPEG, WEBP o SVG",
        },
        { status: 400 },
      )
    }

    const maxSize = 5 * 1024 * 1024 // 5MB en bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "El archivo es demasiado grande. Tamaño máximo: 5MB",
        },
        { status: 400 },
      )
    }

    const blob = await put(file.name, file, {
      access: "public",
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 })
  }
}
