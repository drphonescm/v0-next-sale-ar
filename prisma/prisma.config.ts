import { defineConfig } from "@prisma/config"

export default defineConfig({
  // Ubicación del schema
  schema: "./schema.prisma",
  // Configuración del datasource (sin anidar bajo 'db')
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
