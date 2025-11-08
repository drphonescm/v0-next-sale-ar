import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"
import { Resend } from "resend"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    console.log("[v0] Solicitud de recuperación para:", email)

    // Buscar usuario
    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      console.log("[v0] Usuario no encontrado:", email)
      // Por seguridad, siempre devolvemos el mismo mensaje
      return NextResponse.json({
        message: "Si el email existe, recibirás un enlace de recuperación",
      })
    }

    console.log("[v0] Usuario encontrado, generando token...")

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hora

    // Guardar token en la base de datos
    await db.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    console.log("[v0] Token guardado en DB")

    // Construir URL de recuperación
    const resetUrl = `https://nextsalearg.vercel.app/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

    // Enviar correo con Resend
    if (!process.env.RESEND_API_KEY) {
      console.error("[v0] ❌ RESEND_API_KEY no configurada")
      return NextResponse.json({ error: "Servicio de correo no configurado" }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    try {
      const result = await resend.emails.send({
        from: "NextSale <onboarding@resend.dev>",
        to: email,
        subject: "Recupera tu contraseña - NextSale",
        // Versión de texto plano (importante para evitar spam)
        text: `
Hola,

Recibimos una solicitud para restablecer tu contraseña en NextSale.

Para crear una nueva contraseña, visita este enlace:
${resetUrl}

Este enlace expirará en 1 hora.

Si no solicitaste este cambio, puedes ignorar este correo.

Saludos,
El equipo de NextSale
        `,
        // Versión HTML simplificada
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">NextSale</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Recupera tu contraseña</h2>
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                Recibimos una solicitud para restablecer tu contraseña en NextSale.
              </p>
              <p style="color: #666666; line-height: 1.6; margin: 0 0 30px 0;">
                Haz clic en el botón para crear una nueva contraseña:
              </p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${resetUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                      Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                O copia y pega este enlace en tu navegador:
              </p>
              <p style="color: #0066cc; font-size: 12px; word-break: break-all; margin: 0 0 30px 0;">
                ${resetUrl}
              </p>
              
              <p style="color: #666666; line-height: 1.6; margin: 0 0 10px 0;">
                <strong>⏰ Este enlace expirará en 1 hora.</strong>
              </p>
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 0;">
                Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} NextSale. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      })

      console.log("[v0] ✅ Correo enviado exitosamente. ID:", result.data?.id)
      console.log("[v0] Detalles de envío:", JSON.stringify(result, null, 2))
    } catch (emailError: any) {
      console.error("[v0] ❌ Error al enviar correo:", emailError)
      console.error("[v0] Detalles del error:", JSON.stringify(emailError, null, 2))
      // No revelamos el error al usuario por seguridad
    }

    return NextResponse.json({
      message:
        "Si el email existe, recibirás un enlace de recuperación. Revisa tu bandeja de entrada y carpeta de spam.",
      success: true,
    })
  } catch (error: any) {
    console.error("[v0] 🔥 Error en forgot-password:", error)
    console.error("[v0] Stack trace:", error.stack)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
