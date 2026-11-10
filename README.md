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

## Variables de entorno

Ver [`.env.example`](.env.example). Nunca subas claves al repositorio.

| Variable | Dónde se usa | Pública |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente y servidor | Sí |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Cliente y servidor | Sí (protegida por RLS) |
| `SUPABASE_SECRET_KEY` | Solo `npm run seed` y tests de RLS | **No** |
| `NEXT_PUBLIC_SITE_URL` | Enlaces de confirmación de correo y login con Google | Sí |
| `ANUNCIOS_PROVEEDOR` | `plantillas` (por defecto) o `ia` | No |
| `ANUNCIOS_IA_API_KEY` | Reservada para conectar IA al generador de anuncios | **No** |

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
2. En **Settings → Environment Variables** agrega `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `NEXT_PUBLIC_SITE_URL` (la URL final de Vercel). `SUPABASE_SECRET_KEY` **no** es necesaria en Vercel.
3. Deploy.

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
