// lib/prisma.ts
import { PrismaClient } from "@prisma/client"

// Definir el tipo global para evitar múltiples instancias en desarrollo
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined
}

// Función para instanciar el cliente
const prismaClientSingleton = () => {
  // En Prisma 7, pasamos la URL explícitamente para mayor seguridad
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// Instanciar el cliente usando la variable global o creando una nueva
const prisma = global.prismaGlobal ?? prismaClientSingleton()

export default prisma
export { prisma }

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma
}
