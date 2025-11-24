import { exec } from "child_process"
import path from "path"
import fs from "fs"

console.log("[v0] Iniciando generación de cliente Prisma...")

// Intentar encontrar el binario local
const localPrismaBin = path.join(process.cwd(), "node_modules", ".bin", "prisma")
let command = "npx prisma generate"

if (fs.existsSync(localPrismaBin)) {
  console.log(`[v0] Binario local encontrado en: ${localPrismaBin}`)
  command = `"${localPrismaBin}" generate`
} else {
  console.log("[v0] Binario local no encontrado, usando npx...")
}

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`[v0] Error ejecutando prisma generate: ${error.message}`)
    if (stderr) console.error(`[v0] Stderr: ${stderr}`)
    return
  }

  console.log(`[v0] Stdout: ${stdout}`)
  if (stderr) console.log(`[v0] Log adicional: ${stderr}`)
  console.log("[v0] Cliente Prisma generado exitosamente.")
})
