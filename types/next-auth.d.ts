declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      companyId?: string
      companyName?: string
    }
  }

  interface User {
    companyId?: string
    companyName?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    companyId?: string
    companyName?: string
  }
}
