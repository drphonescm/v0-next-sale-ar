import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function GET() {
  try {
    // Verificar que la API key existe
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "RESEND_API_KEY no está configurada en las variables de entorno",
          hint: "Ve a Vercel → Settings → Environment Variables y agrega RESEND_API_KEY",
        },
        { status: 500 },
      )
    }

    // Intentar inicializar Resend
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Intentar enviar un correo de prueba
    const result = await resend.emails.send({
      from: "NextSale <onboarding@resend.dev>",
      to: "delivered@resend.dev", // Email de prueba de Resend
      subject: "Test - NextSale",
      html: "<p>Este es un correo de prueba de NextSale</p>",
    })

    return NextResponse.json({
      success: true,
      message: "Resend está configurado correctamente",
      emailId: result.data?.id,
      details: result,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error desconocido",
        details: error,
        hint: "Verifica que tu RESEND_API_KEY sea válida",
      },
      { status: 500 },
    )
  }
}
