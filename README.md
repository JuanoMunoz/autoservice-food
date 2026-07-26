# CheesePapas Autoservicio Food

Skeleton base para proyectos Next.js con **Better Auth** (autenticación), **Prisma 7** (ORM) como acceso a datos, y un sistema de **auditoría automática** integrado a nivel de cliente Prisma (registro de `createdById` / `updatedById` y logs de cambios en `AuditLog`).

## Stack

- [Next.js](https://nextjs.org/) (App Router)
- [Better Auth](https://www.better-auth.com/) — autenticación
- [Prisma 7](https://www.prisma.io/) + `@prisma/adapter-pg` — ORM sobre PostgreSQL
- [pnpm](https://pnpm.io/) — gestor de paquetes
- TypeScript

## Estructura del proyecto

```
app/
  layout.tsx
  page.tsx
  manifest.ts
  globals.css
lib/
  auth/
    auth.ts              # Configuración de Better Auth (usa el cliente de prisma.ts)
    audit-context.ts      # AsyncLocalStorage con userId / ip / userAgent
    prisma.ts              # Cliente Prisma ÚNICO, extendido con auditoría automática
    generated/              # Cliente Prisma generado (output custom)
  utils/
    auth.ts
    utils.ts
prisma/
  schema.prisma
  seed.ts                 # Seed de usuario admin por defecto
  migrations/
public/
types/
.env
.env.example
next.config.ts
prisma.config.ts          # Config de Prisma 7 (schema, migrations, seed, datasource)
package.json
```

> ⚠️ **Un solo cliente Prisma.** `lib/auth/auth.ts` **no** crea su propio `PrismaClient` — importa el cliente ya extendido desde `lib/auth/prisma.ts` y se lo pasa a `prismaAdapter()`. Esto es intencional: así todo lo que hace Better Auth internamente (signup, sesiones, cuentas) también pasa por el sistema de auditoría y usa el mismo pool de conexiones. Si en algún momento ves dos `new PrismaClient(...)` distintos en el proyecto, es un bug — hay que unificarlos.

## Requisitos previos

- Node.js 20.6+ (para poder usar `--env-file` de forma nativa si hace falta)
- pnpm 9+
- Una base de datos PostgreSQL corriendo (local, Docker, Supabase, Neon, etc.)

## 1. Clonar e instalar dependencias

```bash
pnpm install
```

Confirmá que `tsx` esté como dependencia de desarrollo (lo usa el seed y `prisma.config.ts`):

```bash
pnpm add -D tsx
```

## 2. Variables de entorno

Copiá el archivo de ejemplo y completá tus valores:

```bash
cp .env.example .env
```

Variables mínimas esperadas:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mi_db?schema=public"
BETTER_AUTH_SECRET="genera-un-secreto-random"
BETTER_AUTH_URL="http://localhost:3000"

# Seed de usuario admin por defecto
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="ChangeMe123!"
SEED_ADMIN_NAME="Admin"
SEED_ALLOW_PRODUCTION="false"
```

Para generar un secreto seguro:

```bash
pnpx @better-auth/cli secret
```

## 3. Scripts de `package.json`

> ⚠️ **CRÍTICO — nunca nombres un script `"prisma"`.** Cuando corrés `pnpm prisma <comando>`, pnpm primero busca si existe un script en `"scripts"` llamado exactamente `"prisma"`. Si existe, pnpm ejecuta **ese script** y le reenvía todo lo que sigue como argumentos — nunca llega a invocar el binario real de Prisma. Esto pasó en este proyecto: había un script `"prisma": "tsx --env-file=.env prisma/seed.ts"`, y por eso `pnpm prisma migrate dev ...` terminaba ejecutando el seed con `"migrate" "dev" "--name" "init"` como argv, sin correr ninguna migración real — y el error resultante (`the table 'public.user' does not exist`) escondía la causa de fondo.

Usá estos nombres de scripts en `package.json`, que no colisionan con ningún binario:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate --config prisma.config.ts",
    "db:migrate": "prisma migrate dev --config prisma.config.ts",
    "db:migrate:deploy": "prisma migrate deploy --config prisma.config.ts",
    "db:migrate:status": "prisma migrate status --config prisma.config.ts",
    "db:reset": "prisma migrate reset --config prisma.config.ts",
    "db:studio": "prisma studio --config prisma.config.ts",
    "db:seed": "tsx --env-file=.env prisma/seed.ts"
  }
}
```

Con esto, los comandos de uso diario quedan:

```bash
pnpm db:migrate --name init          # crear + aplicar migración, corre el seed
pnpm db:migrate:status                # ver estado de migraciones
pnpm db:generate                      # regenerar el cliente Prisma
pnpm db:studio                        # abrir Prisma Studio
pnpm db:seed                          # correr el seed manualmente
pnpm db:reset                         # ⚠️ resetea la base y vuelve a seedear
```

### Generar una migración con nombre

El nombre de la migración va después de `--name` (o `-n`), y como el script ya trae flags propios, hay que pasarlo con `--`:

```bash
pnpm db:migrate --name nombre_de_la_migracion
```

Ejemplo real:

```bash
pnpm db:migrate --name init_auth_schema
```

Si preferís no depender del script y llamar a la CLI directo (útil para debugging, como hicimos en esta guía):

```bash
npx prisma migrate dev --name nombre_de_la_migracion --config prisma.config.ts
```

Para revisar el SQL generado **sin aplicarlo todavía**:

```bash
npx prisma migrate dev --name nombre_de_la_migracion --config prisma.config.ts --create-only
```

## 4. `prisma.config.ts`

Este proyecto usa **Prisma 7**, que centraliza toda la configuración (schema, ruta de migraciones, datasource y comando de seed) en `prisma.config.ts` en vez del bloque `"prisma"` de `package.json`:

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

`import "dotenv/config"` carga el `.env` automáticamente, así que **no** hace falta pasar `--env-file` a mano en la terminal.

> ⚠️ **Importante:** en este setup, la CLI de Prisma no siempre auto-detecta `prisma.config.ts`. Si un comando corre "sospechosamente rápido" y no muestra el output normal de Prisma (`Applying migration...`, etc.), es señal de que no está usando tu config. Pasá siempre `--config prisma.config.ts` explícitamente hasta confirmar que tu setup lo detecta solo.

## 5. Prisma — cliente y base de datos

### Generar el cliente Prisma

```bash
pnpm db:generate
```

### Crear y aplicar migraciones (desarrollo)

```bash
pnpm db:migrate --name init
```

Esto crea el archivo de migración SQL, lo aplica contra tu base de datos, regenera el cliente y **corre el seed automáticamente** (definido en `migrations.seed`).

Si querés revisar el SQL generado antes de aplicarlo:

```bash
pnpm db:migrate --name init -- --create-only
```

### Aplicar migraciones pendientes (producción / CI)

```bash
pnpm db:migrate:deploy
```

### Ver y editar datos con Prisma Studio

```bash
pnpm db:studio
```

Usalo para confirmar visualmente que las tablas de Better Auth (`User`, `Session`, `Account`, `Verification`) existen después de migrar.

### Resetear la base de datos (⚠️ borra todos los datos)

```bash
pnpm db:reset
```

### Formatear el schema

```bash
npx prisma format --config prisma.config.ts
```

## 6. Better Auth

### Generar el schema de auth dentro de Prisma

Si modificás la configuración de Better Auth (proveedores, plugins, campos adicionales como `role`), regenerá el schema:

```bash
pnpx @better-auth/cli generate
```

Esto actualiza `prisma/schema.prisma` con los modelos que necesita Better Auth (`User`, `Session`, `Account`, `Verification`, etc.). Después corré la migración:

```bash
pnpm db:migrate --name update_auth_schema
```

Confirmá que el schema realmente tiene los modelos antes de migrar:

```bash
grep -n "^model" prisma/schema.prisma
```

## 7. Seed — usuario admin por defecto

El seed (`prisma/seed.ts`) crea un usuario admin usando `auth.api.signUpEmail` (así la contraseña queda hasheada correctamente por Better Auth, en vez de insertarse a mano). Es idempotente: si el email ya existe, no falla, solo lo omite.

### Correrlo manualmente

```bash
pnpm db:seed
```

### Se corre automáticamente después de

```bash
pnpm db:migrate --name algo
pnpm db:reset
```

### Seguridad

El seed se frena solo si `NODE_ENV=production`, a menos que se setee explícitamente `SEED_ALLOW_PRODUCTION=true`. No hardcodees credenciales — usá las variables de entorno (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`).

## 8. Levantar el proyecto en desarrollo

```bash
pnpm dev
```

Por defecto corre en [http://localhost:3000](http://localhost:3000).

## 9. Build y producción

```bash
pnpm build
pnpm start
```

## 10. Lint y type-check

```bash
pnpm lint
pnpm tsc --noEmit
```

`tsc --noEmit` chequea tipos sin generar archivos de salida — más rápido que `pnpm build` para iterar. Next.js también corre el type-check como parte del `build`, salvo que tengas `typescript.ignoreBuildErrors: true` en `next.config.ts`.

## Sistema de auditoría (`lib/auth/prisma.ts`)

El cliente Prisma (el único del proyecto, compartido con Better Auth) está extendido con `$extends` para:

- Inyectar automáticamente `createdById` / `updatedById` en los modelos configurados, tomando el usuario actual desde `audit-context.ts` (vía `AsyncLocalStorage`).
- Registrar cada `create` / `update` / `delete` en la tabla `AuditLog`, guardando estado `before` / `after`, IP y user agent.

Como `auth.ts` usa este mismo cliente, las acciones que dispara Better Auth internamente (signup, cambios de sesión, etc.) también quedan sujetas a esta lógica si el modelo correspondiente (`user`, `session`, etc.) se agrega a `AUDIT_FIELDS`.

### Agregar un modelo nuevo a la auditoría

1. Agregá los campos correspondientes en `prisma/schema.prisma`:

   ```prisma
   model MiModelo {
     id          String   @id @default(cuid())
     createdById String?
     createdBy   User?    @relation(fields: [createdById], references: [id])
   }
   ```

2. Corré la migración:

   ```bash
   pnpm prisma migrate dev --name add_mi_modelo --config prisma.config.ts
   ```

3. Sumá la entrada en `AUDIT_FIELDS` dentro de `lib/auth/prisma.ts`:

   ```ts
   const AUDIT_FIELDS: Record<string, string[]> = {
     miModelo: ["createdById"],
     // ...
   }
   ```

La clave debe coincidir en camelCase (primera letra minúscula) con el nombre del modelo en el schema. Si el campo listado en el array no existe realmente en el modelo, Prisma va a tirar un error en runtime al intentar setearlo.

## Scripts disponibles (`package.json`)

| Comando | Descripción |
|---|---|
| `pnpm dev` | Levanta el servidor de desarrollo |
| `pnpm build` | Genera el build de producción (incluye type-check) |
| `pnpm start` | Corre el build de producción |
| `pnpm lint` | Corre el linter |
| `pnpm tsc --noEmit` | Chequea tipos sin generar archivos |
| `pnpm prisma generate --config prisma.config.ts` | Genera el cliente Prisma |
| `pnpm prisma migrate dev --config prisma.config.ts` | Crea y aplica migraciones en desarrollo, corre el seed |
| `pnpm prisma migrate deploy --config prisma.config.ts` | Aplica migraciones en producción |
| `pnpm prisma migrate reset --config prisma.config.ts` | ⚠️ Resetea la base y vuelve a correr el seed |
| `pnpm prisma db seed --config prisma.config.ts` | Corre el seed manualmente |
| `pnpm prisma studio --config prisma.config.ts` | Abre la UI de administración de datos |
| `pnpm prisma format --config prisma.config.ts` | Formatea el `schema.prisma` |
| `pnpx @better-auth/cli generate` | Regenera los modelos de Better Auth en el schema |
| `pnpx @better-auth/cli secret` | Genera un `BETTER_AUTH_SECRET` seguro |

## Troubleshooting

- **`The table 'public.user' does not exist`**: la migración nunca se aplicó de verdad (probablemente porque el comando corrió sin `--config prisma.config.ts` y no detectó el schema real). Verificá con `grep -n "^model" prisma/schema.prisma` que los modelos existan, y corré `pnpm prisma migrate dev --config prisma.config.ts` de nuevo revisando el output completo.
- **Un comando de Prisma "corre" en menos de 2 segundos sin mostrar output**: casi seguro no está usando `prisma.config.ts`. Agregá `--config prisma.config.ts` explícitamente.
- **El seed no encuentra las variables de entorno**: confirmá que `.env` tenga `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` y `SEED_ADMIN_NAME`, y que `prisma.config.ts` tenga `import "dotenv/config"` en la primera línea.

## Notas

- El cliente Prisma se genera en una ruta custom (`lib/generated/prisma/client` o `../generated/prisma/client` desde `lib/auth/`), configurada en el bloque `generator client` de `schema.prisma`. Cualquier cambio de esa ruta requiere ajustar los imports en `prisma.ts` y `auth.ts`.
- En desarrollo, el cliente Prisma se cachea en `globalThis` para evitar exceder el límite de conexiones por hot-reload de Next.js.
- Si `prismaAdapter()` de Better Auth se queja de tipos al recibir el cliente extendido, se puede resolver con un cast: `prismaAdapter(prisma as unknown as PrismaClient, { provider: "postgresql" })`.