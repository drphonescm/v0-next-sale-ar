import { defineConfig, env } from "prisma/config"

export default defineConfig({
  // Ubicación del schema
  schema: "./schema.prisma",
  // Configuración del datasource usando env() de prisma/config
  datasource: {
    url: env("DATABASE_URL"),
  },
})
