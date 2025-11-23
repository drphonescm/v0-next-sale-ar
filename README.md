# NextSale - Sistema de Gestión de Ventas

Sistema de punto de venta (POS) desarrollado con Next.js 16, Prisma, PostgreSQL (Neon) y NextAuth.

## 🚀 Características

- ✅ Gestión de productos, clientes y proveedores
- ✅ Sistema de ventas con facturación A4 y tickets
- ✅ Control de caja (ingresos y egresos)
- ✅ Reportes exportables a Excel
- ✅ Autenticación con NextAuth
- ✅ Recuperación de contraseña por email (Resend)
- ✅ Tema claro/oscuro
- ✅ Responsive design

## 📋 Requisitos previos

- Node.js 18+ 
- Cuenta en [Vercel](https://vercel.com)
- Base de datos PostgreSQL en [Neon](https://neon.tech)
- API Key de [Resend](https://resend.com) para emails

## 🔧 Configuración en Vercel

### 1. Variables de entorno requeridas

Ve a **Vercel → Tu Proyecto → Settings → Environment Variables** y agrega:

\`\`\`bash
# Base de datos (Neon)
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=tu_secret_aleatorio_aqui
NEXTAUTH_URL=https://tu-dominio.vercel.app

# Resend (para recuperación de contraseña)
RESEND_API_KEY=re_jHBkZBRV_AvArUqwTNSucgT54L1WTMp9p
\`\`\`

### 2. Generar NEXTAUTH_SECRET

Ejecuta en tu terminal:

\`\`\`bash
openssl rand -base64 32
\`\`\`

Copia el resultado y úsalo como valor de `NEXTAUTH_SECRET`.

### 3. Configurar Resend

1. Crea una cuenta en [Resend](https://resend.com)
2. Ve a **API Keys** y crea una nueva
3. Copia la API Key y agrégala como `RESEND_API_KEY` en Vercel
4. El sistema usará el dominio de prueba: `onboarding@resend.dev`

## 📧 Recuperación de contraseña

El sistema incluye recuperación de contraseña por email:

### Flujo de uso:

1. El usuario visita `/forgot-password`
2. Ingresa su email
3. Recibe un correo con un enlace de recuperación
4. El enlace lo lleva a `/reset-password?token=...&email=...`
5. Puede establecer una nueva contraseña (próximamente)

### Configuración del email:

- **Remitente**: `NextSale <onboarding@resend.dev>`
- **Dominio**: `https://nextsalearg.vercel.app`
- **Expiración del token**: 1 hora

### Personalizar el dominio:

Para usar tu propio dominio en los enlaces de recuperación, edita:

\`\`\`typescript
// app/api/auth/forgot-password/route.ts
const resetUrl = `https://tu-dominio.com/reset-password?token=${resetToken}&email=${email}`
\`\`\`

## 🗄️ Base de datos

### Migrar cambios del schema:

Después de modificar `prisma/schema.prisma`:

\`\`\`bash
npx prisma migrate dev --name nombre_migracion
npx prisma generate
\`\`\`

### Campos agregados para recuperación de contraseña:

\`\`\`prisma
model User {
  // ... campos existentes
  resetToken       String?   @unique
  resetTokenExpiry DateTime?
}
\`\`\`

## 🚀 Deployment

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Vercel detectará automáticamente Next.js
4. El build ejecutará `prisma generate && next build`

## 🆘 Solución de Problemas de Deployment

Si encuentras errores como `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` durante el deployment en Vercel:

1. **El problema:** Existe un conflicto entre la configuración de `package.json` y el archivo `pnpm-lock.yaml` antiguo.
2. **La solución:** Elimina el archivo `pnpm-lock.yaml` de tu repositorio y vuelve a desplegar. Vercel generará uno nuevo y limpio.
3. Las versiones de Prisma han sido fijadas en `6.18.0` para garantizar estabilidad.

## 📱 Páginas principales

- `/` - Landing page
- `/login` - Inicio de sesión
- `/register` - Registro de usuarios
- `/forgot-password` - Recuperar contraseña
- `/reset-password` - Restablecer contraseña
- `/dashboard` - Panel principal
- `/dashboard/products` - Gestión de productos
- `/dashboard/customers` - Gestión de clientes
- `/dashboard/suppliers` - Gestión de proveedores
- `/dashboard/sales` - Historial de ventas
- `/dashboard/sales/new` - Nueva venta
- `/dashboard/cash` - Control de caja
- `/dashboard/reports` - Reportes

## 🛠️ Tecnologías

- **Framework**: Next.js 16 (App Router)
- **Base de datos**: PostgreSQL (Neon) + Prisma ORM
- **Autenticación**: NextAuth.js
- **Emails**: Resend
- **UI**: Tailwind CSS + shadcn/ui
- **Gráficos**: Recharts
- **Exportación**: XLSX (Excel), jsPDF
- **Deployment**: Vercel

## 📄 Licencia

MIT

---

Desarrollado con ❤️ para NextSale Argentina
