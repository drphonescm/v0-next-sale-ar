import { defineConfig } from "@prisma/config"

export default defineConfig({
  schema: "./schema.prisma",
  datasource: {
    db: {
      url: process.env.DATABASE_URL!,
    },
  },
})
