# 🚀 Guía de Configuración: Mercado Pago

## 📌 Resumen del Sistema

Tu aplicación ya tiene **integrado completamente** el sistema de pagos con Mercado Pago. Este documento te guía para conectarlo con tu cuenta real.

---

## 🔧 Pasos de Configuración

### 1️⃣ Crear Aplicación en Mercado Pago

1. Ve a https://www.mercadopago.com.ar/developers
2. Inicia sesión con tu cuenta de Mercado Pago
3. En el panel de "Tus integraciones", haz clic en **"Crear aplicación"**
4. Dale un nombre (ejemplo: "Next Sale ARG")
5. Selecciona "Pagos en línea" como solución de pago

### 2️⃣ Obtener Credenciales

**Para Pruebas (Sandbox):**
- En tu aplicación → Credenciales
- Copia el **Access Token de Prueba**
- Este te permite probar sin dinero real

**Para Producción:**
- Una vez probado, usa el **Access Token de Producción**
- Activa tu cuenta de Mercado Pago completamente
- Verifica tu identidad (DNI, CBU/CVU para recibir pagos)

### 3️⃣ Configurar Variable de Entorno en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com/drphonescm/v0-next-sale-ar
2. Ve a **Settings → Environment Variables**
3. Busca la variable `MERCADOPAGO_ACCESS_TOKEN`
4. **Edita** su valor y pega tu Access Token (de prueba o producción)
5. Guarda y **redespliega** el proyecto

\`\`\`bash
# La variable debe verse así en Vercel:
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxx
\`\`\`

### 4️⃣ Configurar Webhook (Notificaciones)

Para que los pagos se confirmen automáticamente:

1. En tu aplicación de MP → **Webhooks/IPN**
2. Agrega la siguiente URL de notificación:
   \`\`\`
   https://nextsalearg.vercel.app/api/webhooks/mercadopago
   \`\`\`
3. Selecciona el evento: **`payment`**
4. Guarda

---

## 🔄 Cómo Funciona el Flujo

### Usuario Selecciona Plan

\`\`\`
[Usuario en /dashboard/subscription]
        ↓
Selecciona "Mensual ($29.000)" o "Anual ($275.000)"
        ↓
Se crea una Suscripción con status "pending" en la BD
        ↓
Se crea una Preferencia de Pago en Mercado Pago
        ↓
Usuario es redirigido a Mercado Pago para pagar
\`\`\`

### Usuario Paga

\`\`\`
[Usuario completa el pago en Mercado Pago]
        ↓
Mercado Pago envía notificación al webhook
        ↓
Webhook verifica el pago (GET /v1/payments/{id})
        ↓
Si status = "approved":
  - Suscripción cambia a "active"
  - Se establecen startDate y endDate
  - Se crea un registro en AuditLog
        ↓
Usuario tiene acceso completo al sistema
\`\`\`

---

## 🧪 Modo de Pruebas

Si **NO** configuras `MERCADOPAGO_ACCESS_TOKEN`, el sistema usa un **Mock Payment**:

- Los botones de pago redirigen a `/api/mock-payment`
- Se simula un pago exitoso
- La suscripción se activa inmediatamente
- Esto te permite probar el flujo sin Mercado Pago

**Para desactivar el Mock:** Solo agrega tu Access Token real.

---

## 📋 Checklist de Verificación

Antes de ir a producción, verifica:

- [ ] Aplicación creada en Mercado Pago Developers
- [ ] Access Token de Producción obtenido
- [ ] Variable `MERCADOPAGO_ACCESS_TOKEN` configurada en Vercel
- [ ] Webhook configurado apuntando a tu dominio
- [ ] Cuenta de Mercado Pago verificada (DNI + CBU/CVU)
- [ ] Probado un pago real con cuenta de prueba

---

## 🛠️ Archivos Clave del Sistema

### 1. Crear Preferencia de Pago
**Archivo:** `app/api/subscription/create-preference/route.ts`
- Crea la preferencia en Mercado Pago
- Genera el link de pago
- Guarda la suscripción como "pending"

### 2. Webhook (Confirmar Pago)
**Archivo:** `app/api/webhooks/mercadopago/route.ts`
- Recibe notificaciones de Mercado Pago
- Verifica el estado del pago
- Activa la suscripción si está aprobada

### 3. UI de Suscripción
**Archivo:** `app/dashboard/subscription/page.tsx`
- Muestra los planes disponibles
- Botones para pagar con Mercado Pago
- Input para canjear cupones

---

## 🚨 Solución de Problemas

### El pago no se confirma automáticamente
- Verifica que el webhook esté configurado
- Revisa los logs en Vercel (busca `[WEBHOOK_ERROR]`)
- Comprueba que el Access Token sea válido

### Error "Failed to create preference"
- Verifica que `MERCADOPAGO_ACCESS_TOKEN` esté configurado
- Asegúrate de que el token no tenga espacios
- Revisa que sea el token correcto (no el Public Key)

### Usuario paga pero sigue bloqueado
- Verifica que el webhook se haya ejecutado
- Chequea la base de datos: `Subscription.status` debe ser "active"
- Revisa `AuditLog` para ver si se registró el pago

---

## 💡 Recomendaciones de Seguridad

1. **Nunca** expongas el Access Token en el cliente
2. Siempre valida los webhooks (verificar firma MP si es posible)
3. Usa HTTPS en producción (Vercel lo hace automáticamente)
4. Considera agregar autenticación adicional al webhook

---

## 📞 Soporte

- Documentación oficial: https://www.mercadopago.com.ar/developers/es/docs
- Comunidad: https://www.mercadopago.com.ar/developers/es/support
