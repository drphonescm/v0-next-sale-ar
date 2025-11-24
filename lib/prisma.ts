import { PrismaClient } from "@prisma/client"

// Definir el tipo global para evitar múltiples instancias en desarrollo
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    // En Prisma 7, pasamos la URL explícitamente para asegurar la conexión
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// Usar globalThis es el estándar moderno
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma
export { prisma }

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma
}
