import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth-config"

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const body = await req.json()
    const { plan } = body

    if (!["MONTHLY", "ANNUAL"].includes(plan)) {
      return new NextResponse("Invalid plan", { status: 400 })
    }

    const price = plan === "MONTHLY" ? 29000 : 275000
    const title = `Suscripción ${plan === "MONTHLY" ? "Mensual" : "Anual"} - Next Sale ARG`

    // Create pending subscription
    const subscription = await db.subscription.create({
      data: {
        userId: user.id, // Use user.id instead of session.user.id
        plan,
        status: "pending",
        paymentMethod: "mercadopago",
      },
    })

    // If no MP token, use Mock Payment for testing
    if (!MP_ACCESS_TOKEN) {
      console.log("[MP] No token found, using mock payment")
      return NextResponse.json({
        url: `${BASE_URL}/api/mock-payment?subscriptionId=${subscription.id}&plan=${plan}`,
      })
    }

    // Create MP Preference
    const preferenceData = {
      items: [
        {
          title,
          unit_price: price,
          quantity: 1,
          currency_id: "ARS", // Or USD if supported, usually ARS in Argentina
        },
      ],
      back_urls: {
        success: `${BASE_URL}/dashboard/subscription?status=success`,
        failure: `${BASE_URL}/dashboard/subscription?status=failure`,
        pending: `${BASE_URL}/dashboard/subscription?status=pending`,
      },
      auto_return: "approved",
      external_reference: subscription.id,
      notification_url: `${BASE_URL}/api/webhooks/mercadopago`,
    }

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferenceData),
    })

    if (!mpRes.ok) {
      const error = await mpRes.text()
      console.error("[MP_ERROR]", error)
      throw new Error("Failed to create preference")
    }

    const mpData = await mpRes.json()

    // Update subscription with MP ID
    await db.subscription.update({
      where: { id: subscription.id },
      data: { mercadoPagoId: mpData.id },
    })

    return NextResponse.json({ url: mpData.init_point })
  } catch (error) {
    console.error("[CREATE_PREFERENCE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
