// lib/prisma.ts
import { PrismaClient } from "@prisma/client"

declare global {
  var prismaGlobal: PrismaClient | undefined
}

// Singleton para evitar múltiples instancias en desarrollo
const prismaClient = global.prismaGlobal ?? new PrismaClient()
if (process.env.NODE_ENV !== "production") global.prismaGlobal = prismaClient

// Exportación consistente
export const prisma = prismaClient
export default prismaClient
