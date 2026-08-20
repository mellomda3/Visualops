# Migración de base de datos

Etapa 0: **Supabase Free**. Si aprueban el proyecto: misma API, Postgres más robusto.

## Qué es portable

- Tablas Postgres (UUID, `timestamptz`, `numeric`)
- Archivos: columna `files.path` = clave de objeto, no URL de un vendor
- Clientes (web / Android) hablan REST + Auth, no SQL directo en la UI

## Camino 1 — más simple (recomendado al aprobar)

Subir el mismo proyecto a **Supabase Pro**:

- No se pausa
- Más disco y backups
- Cero cambios de código

## Camino 2 — Postgres propio + S3

1. `pg_dump` de `public.*` (sin `auth.*` si cambias de proveedor de login)
2. Restaurar en RDS / Cloud SQL / Neon
3. Copiar bucket `archivos` a S3 / R2 / MinIO
4. Auth: seguir con GoTrue o reemplazar (Clerk, etc.) y mapear `profiles.id`
5. Apuntar `VITE_SUPABASE_URL` / Android `BASE_URL` al nuevo API o a PostgREST

Los IDs UUID de fichas y archivos se mantienen.

## Lo que no hay que hacer

- Guardar fotos solo en el celular
- Pegar SQL de un vendor en la app Android
- Usar Render Postgres Free (vence a los 30 días)
