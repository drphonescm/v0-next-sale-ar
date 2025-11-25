import { PrismaClient } from "@prisma/client"

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient()
}

const db = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = db
}

export { db }
export default db
