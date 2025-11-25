import { PrismaClient } from "@prisma/client"

// Definir el tipo global para evitar múltiples instancias en desarrollo
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient()
}

// Usar globalThis es el estándar moderno
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma
export { prisma }

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma
}
