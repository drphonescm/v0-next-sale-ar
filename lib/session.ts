import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-config"
import { db } from "@/lib/db"

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions)
    return session?.user
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function getCompanyId(): Promise<string> {
  try {
    const user = await getCurrentUser()

    // Si hay usuario autenticado, usar su companyId
    if (user) {
      let companyId = (user as any).companyId

      if (!companyId) {
        console.log("[v0] CompanyId not in session, fetching from database")
        const dbUser = await db.user.findUnique({
          where: { id: (user as any).id },
          select: { companyId: true },
        })

        if (dbUser?.companyId) {
          companyId = dbUser.companyId
        }
      }

      if (companyId) {
        return companyId
      }
    }

    // Si no hay usuario o no tiene companyId, buscar o crear compañía por defecto
    console.log("[v0] No authenticated user, using default company")
    let defaultCompany = await db.company.findFirst({
      orderBy: { createdAt: "asc" },
    })

    // Si no existe ninguna compañía, crear una por defecto
    if (!defaultCompany) {
      console.log("[v0] Creating default company")
      defaultCompany = await db.company.create({
        data: {
          name: "Next Sale",
          cuit: null,
          address: null,
          logoUrl: null,
        },
      })
    }

    return defaultCompany.id
  } catch (error) {
    console.error("[v0] Error in getCompanyId:", error)
    throw new Error("Failed to get company ID")
  }
}
