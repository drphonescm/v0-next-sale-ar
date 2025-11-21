import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: Request) {
  try {
    console.log("[v0] Starting file upload...")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log("[v0] No file provided in form data")
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    console.log("[v0] File received:", file.name, file.type, file.size)

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]
    if (!validTypes.includes(file.type)) {
      console.log("[v0] Invalid file type:", file.type)
      return NextResponse.json(
        {
          error: "Tipo de archivo no válido. Solo se permiten PNG, JPG, JPEG, WEBP o SVG",
        },
        { status: 400 },
      )
    }

    const maxSize = 5 * 1024 * 1024 // 5MB en bytes
    if (file.size > maxSize) {
      console.log("[v0] File too large:", file.size)
      return NextResponse.json(
        {
          error: "El archivo es demasiado grande. Tamaño máximo: 5MB",
        },
        { status: 400 },
      )
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("[v0] Missing BLOB_READ_WRITE_TOKEN environment variable")
      return NextResponse.json(
        { error: "Configuración del servidor incompleta. Contacta al administrador." },
        { status: 500 },
      )
    }

    console.log("[v0] Uploading to Vercel Blob...")

    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const uniqueName = `logos/${timestamp}-${sanitizedName}`

    const blob = await put(uniqueName, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log("[v0] File uploaded successfully:", blob.url)

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: `Error al subir el archivo: ${errorMessage}` }, { status: 500 })
  }
}
