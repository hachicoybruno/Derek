# FLIPDESK

Sistema de gestión para revendedores de autos usados en Perú: stock, gastos, documentos, ganancias reales, calculadora de compra, vencimientos y anuncios. Pensado para usarse desde el celular.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, RLS) · PWA · Vercel.

---

## Requisitos

- Node.js 20.9 o superior (recomendado 22)
- Docker (solo para correr Supabase en local)

## Instalación local

```bash
npm install
cp .env.example .env.local
npm run db:start            # levanta Supabase local y aplica las migraciones
```

`npm run db:start` imprime la URL y las claves locales. Cópialas a `.env.local`:

| Variable | Valor local |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `PUBLISHABLE_KEY` (o `ANON_KEY`) |
| `SUPABASE_SECRET_KEY` | `SECRET_KEY` (o `SERVICE_ROLE_KEY`) |

Luego:

```bash
npm run seed                # opcional: crea el usuario demo con 5 autos
npm run dev                 # http://localhost:3000
```

Usuario demo: `demo@flipdesk.pe` / `demo12345`.

> Si tu red bloquea algunas imágenes de Docker (Studio, edge-runtime), usa `npm run db:start:min`, que levanta solo lo necesario.

### Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm test` | Tests (cálculos, formatos, anuncios y, si Supabase local está activo, RLS) |
| `npm run lint` / `npm run typecheck` | Calidad de código |
| `npm run db:start` / `db:stop` / `db:reset` | Supabase local (`db:reset` borra los datos y reaplica migraciones) |
| `npm run seed` | Crea el usuario demo con 5 autos de ejemplo |

## Cómo probar la Fase 1

Con `npm run dev` corriendo y el usuario demo cargado (`npm run seed`), abre http://localhost:3000 (en Chrome usa el modo celular con F12 → ícono de dispositivo):

1. **Landing** en `/` → "Ya tengo cuenta" → entra con `demo@flipdesk.pe` / `demo12345`.
2. **Dashboard:** ganancia del mes, autos en stock, capital inmovilizado, días promedio, margen por modelo y el aviso rojo de vencimientos.
3. **Autos:** filtra por estado y busca `dem-103`, `kia` o `toyota yaris`. Descarga el **Excel**.
4. **Botón +:** registra un auto (placa, año, marca, modelo y precio) y guarda.
5. **Ficha:** sube fotos, agrega un gasto (el costo y la ganancia proyectada se recalculan), agrega un SOAT que venza en pocos días, registra al vendedor y luego "Registrar venta".
6. **Anuncios:** en la ficha de un auto sin vender → "Crear anuncios…" → cambia de pestaña y copia.
7. **¿Lo compro?:** prueba 28,000 + 2,000 → 36,000 (verde) y 32,000 + 2,000 → 36,000 (rojo). Cambia los umbrales en **Ajustes** (⚙️).
8. **Vencimientos:** muestra el SOAT vencido y los que vencen en los próximos 30 días.
9. **PWA:** con `npm run build && npm start`, Chrome ofrece "Instalar app"; sin conexión aparece la página "Estás sin conexión".
10. **Cuenta nueva:** regístrate con otro correo, no verás los autos del demo (RLS). Usa "Cargar 5 autos de ejemplo".

## Cómo probar la Fase 2 (documentos)

1. **Ajustes (⚙️):** completa tu nombre, DNI y dirección (aparecen cuando tú vendes).
2. Abre la ficha del **Toyota Yaris (DEM-101)**, que ya tiene comprador → sección **Contratos y recibos**.
3. **Contrato de compraventa** → revisa precio, fecha y forma de pago → **Generar PDF** (se abre en otra pestaña; en el celular se puede compartir o imprimir).
4. Genera el **Recibo** (prueba concepto "separación del vehículo" y otro monto) y la **Constancia de entrega**.
5. Cambia "¿Quién vende?" a **Dueño anterior** para que firme el vendedor registrado en la ficha.
6. **Plantillas** (desde Ajustes o desde el aviso de la ficha): edita el recibo, inserta datos con los botones, usa **Vista previa**, guarda y vuelve a generar el PDF. Luego **Restaurar plantilla original**.

## Variables de entorno

Ver [`.env.example`](.env.example). Nunca subas claves al repositorio.

| Variable | Dónde se usa | Pública |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente y servidor | Sí |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Cliente y servidor | Sí (protegida por RLS) |
| `SUPABASE_SECRET_KEY` | Servidor: confirmar pagos, webhooks, alertas, equipo; también `npm run seed` | **No** |
| `NEXT_PUBLIC_SITE_URL` | Enlaces de confirmación de correo y login con Google | Sí |
| `ANUNCIOS_PROVEEDOR` | `plantillas` (por defecto) o `ia` | No |
| `ANUNCIOS_IA_API_KEY` | Reservada para conectar IA al generador de anuncios | **No** |
| `PAGOS_PROVEEDOR` | `paypal` o `simulado` (vacío = automático) | No |
| `PAYPAL_ENTORNO` / `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | Credenciales de la app de PayPal | **No** (el Client ID sí es público) |
| `PAYPAL_WEBHOOK_ID` | Verificar la firma de los webhooks | **No** |
| `PAYPAL_PLAN_BASICO` / `_PRO` / `_CONCESIONARIO` | IDs de los planes en PayPal | No |
| `CRON_SECRET` | Protege el cron diario de alertas | **No** |
| `RESEND_API_KEY` / `CORREO_REMITENTE` | Envío de correos (alertas e invitaciones) | **No** / No |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business Cloud API | **No** / No |
| `WHATSAPP_PLANTILLA` / `WHATSAPP_IDIOMA` / `WHATSAPP_API_VERSION` | Plantilla aprobada para las alertas | No |

## Base de datos

Las migraciones están en `supabase/migrations/`. Incluyen tablas, Row Level Security (cada usuario ve solo sus datos), la vista `autos_resumen` y los buckets de storage.

## Deploy (Supabase + Vercel)

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (región recomendada: São Paulo, `sa-east-1`, la más cercana a Lima).
2. Aplica las migraciones:
   ```bash
   npx supabase login
   npx supabase link --project-ref TU_PROJECT_REF
   npx supabase db push
   ```
3. **Authentication → URL Configuration:**
   - Site URL: `https://tu-dominio.vercel.app`
   - Redirect URLs: `https://tu-dominio.vercel.app/auth/callback`
4. **Login con Google** (opcional):
   1. En [Google Cloud Console](https://console.cloud.google.com/apis/credentials) crea un "ID de cliente de OAuth" tipo *Aplicación web*.
   2. Orígenes autorizados: `https://tu-dominio.vercel.app`.
   3. URI de redirección autorizada: `https://TU_PROJECT_REF.supabase.co/auth/v1/callback`.
   4. En Supabase → Authentication → Providers → Google, pega el Client ID y el Client Secret y actívalo.

### 2. Vercel

1. Importa el repositorio en [vercel.com/new](https://vercel.com/new) (framework: Next.js, sin cambios en el build).
2. En **Settings → Environment Variables** agrega `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` (la URL final de Vercel) y `SUPABASE_SECRET_KEY` (necesaria en el servidor para pagos, alertas y equipo; nunca con prefijo `NEXT_PUBLIC_`). Agrega también las variables de PayPal y de alertas (ver abajo).
3. Deploy. `vercel.json` fija la región `gru1` (São Paulo), cerca de Lima y de Supabase `sa-east-1`.
4. Si cambias el dominio, actualiza `NEXT_PUBLIC_SITE_URL` y las Redirect URLs de Supabase.

## Pagos con PayPal (Fase 3)

PayPal muestra dos botones: **PayPal** y **Tarjeta de débito o crédito** (sin cuenta PayPal). PayPal **no opera en soles**: los planes se cobran en US$ (S/ 49 ≈ US$ 13, S/ 119 ≈ US$ 32, S/ 249 ≈ US$ 67; ver `lib/planes.ts`).

1. Crea una app en [developer.paypal.com](https://developer.paypal.com/dashboard/applications) (primero en *Sandbox*). Copia Client ID y Secret a `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`, con `PAYPAL_ENTORNO=sandbox`.
2. Crea los planes: `npx tsx scripts/paypal-crear-planes.ts` y copia las líneas `PAYPAL_PLAN_*` que imprime.
3. En la app de PayPal → **Webhooks** → *Add webhook*: URL `https://TU-DOMINIO/api/pagos/paypal/webhook`, eventos `BILLING.SUBSCRIPTION.*` y `PAYMENT.SALE.*`. Copia el *Webhook ID* a `PAYPAL_WEBHOOK_ID`.
4. Prueba con una cuenta de comprador sandbox. Para producción repite con credenciales *Live* y `PAYPAL_ENTORNO=live`.

**Sin credenciales de PayPal**, en desarrollo se usa el **proveedor simulado**: los botones dicen "(simulado)" y activan el plan sin cobrar. En producción el simulador está apagado salvo `PAGOS_PERMITIR_SIMULADO=true`.

**Cambiar de proveedor** (Culqi, Mercado Pago, Stripe…): implementa `ProveedorPagos` (`lib/pagos/tipos.ts`) y regístralo en `lib/pagos/index.ts`.

### Cómo probar la Fase 3

1. Regístrate con un correo nuevo: verás "Te quedan 14 días de prueba gratis (plan Pro)".
2. Toca la franja → **Elegir Básico** → "Pagar con tarjeta (simulado)". El plan queda activo.
3. Registra 6 autos: el sexto muestra el límite del Básico. El dashboard muestra "5 / 5" y las funciones Pro bloqueadas.
4. **Cambiar a Pro** → pagar → límites quitados. Luego **Cancelar suscripción**: sigues con acceso hasta fin de periodo.

## Equipo y alertas (Fase 4)

### Equipo (plan Concesionario)

- El **dueño** invita vendedores desde **Ajustes → Equipo** (hasta 4 vendedores, 5 usuarios en total). El enlace se puede copiar, mandar por WhatsApp o, si Resend está configurado, llega por correo. Vence en 7 días y solo lo puede aceptar el correo invitado.
- El **vendedor** ve y registra autos, fotos, gastos, documentos y ventas del negocio, crea anuncios y contratos. **No puede** eliminar registros, ni cambiar plantillas, datos del negocio, suscripción o equipo. Esto se valida también en la base de datos (RLS).
- Si el negocio deja el plan Concesionario, los vendedores pierden el acceso automáticamente (sus cuentas siguen existiendo).

### Alertas por correo y WhatsApp (planes Pro y Concesionario)

Un **cron diario** (`vercel.json`: 13:00 UTC = 8:00 en Lima) llama a `/api/cron/alertas` y avisa cuando un SOAT o una revisión técnica de un auto no vendido vence en **30, 7 y 1 día y el mismo día** (o si ya venció). Cada aviso se envía una sola vez por canal. El dueño elige canales y destinos en **Ajustes → Alertas de vencimiento** y puede mandar un **aviso de prueba**.

1. **Cron:** define `CRON_SECRET` en Vercel (cualquier texto largo y aleatorio). Vercel lo envía automáticamente al ejecutar el cron.
2. **Correo con Resend:** crea una cuenta en [resend.com](https://resend.com), verifica tu dominio y crea una API key → `RESEND_API_KEY`. Define `CORREO_REMITENTE` (p. ej. `FLIPDESK <avisos@tu-dominio.pe>`).
3. **WhatsApp Business Cloud API:**
   1. En [developers.facebook.com](https://developers.facebook.com/) crea una app tipo *Business* y agrega el producto **WhatsApp**. Registra tu número de empresa.
   2. Copia el **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID` y genera un **token permanente** (usuario del sistema) → `WHATSAPP_TOKEN`.
   3. En *WhatsApp Manager → Plantillas* crea una plantilla de categoría **Utilidad**, idioma Español, llamada `alerta_vencimientos`, con el cuerpo: `Hola, FLIPDESK te avisa: {{1}}. Revisa tus vencimientos en la app.` Espera la aprobación de Meta.
   4. Define `WHATSAPP_PLANTILLA=alerta_vencimientos` y `WHATSAPP_IDIOMA` con el código de idioma de la plantilla (`es`, `es_PE`…).

Sin estas variables la app funciona igual; el aviso de prueba indica qué falta configurar.

### Cómo probar la Fase 4

1. Con el usuario demo: **Suscripción → Concesionario → pagar (simulado)**.
2. **Ajustes → Equipo** → invita `vendedor@test.pe` → copia el enlace.
3. En otra ventana de incógnito abre el enlace → **Crear mi cuenta** (el correo viene precargado) → **Unirme al equipo**. El vendedor ve los 5 autos del demo, puede agregar gastos y no ve botones de eliminar.
4. **Ajustes → Alertas** → activa correo/WhatsApp → **Enviar aviso de prueba**. En local, sin Resend ni WhatsApp, verás qué variable falta.
5. Cron manual: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/alertas`.

## Estructura

```
app/                 Rutas (landing, auth y la app en app/(app)/)
components/          Componentes de interfaz
lib/                 Supabase, cálculos, formatos, anuncios, datos de ejemplo
supabase/            Configuración y migraciones
scripts/             Script de datos de ejemplo
tests/               Tests con Vitest
```

## Decisiones

Ver [DECISIONES.md](DECISIONES.md).
