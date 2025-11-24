import { PrismaClient } from "@prisma/client"

declare global {
  var prismaGlobal: PrismaClient | undefined
}

const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma
}

export const db = prisma
export { prisma }
export default prisma
