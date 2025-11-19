import { compare, genSalt, hash } from "bcrypt-ts"
import prisma from "./db"

export async function hashPassword(password: string) {
  const salt = await genSalt(10)
  return hash(password, salt)
}

export async function verifyPassword(password: string, hashValue: string) {
  return compare(password, hashValue)
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { company: true },
  })
}
