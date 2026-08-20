# Visualops

Campañas ópticas: **web de oficina** + **Android de terreno** + **una sola base** (Supabase Free ahora; Postgres robusto si aprueban el proyecto).

## Web (oficina)

```bash
npm install
npm run dev
```

Sin `.env` entra en modo demo. Con Supabase: copiá `.env.example` y corré `supabase/migrations/001_initial.sql` y `002_organizations_files_portable.sql`.

Sitio actual: https://visualops-mellomda.netlify.app/login

## Android (terreno)

Carpeta [`android/`](android/README.md). Kotlin/Compose, cámara/archivos nativos, cola offline.

## Si aprueban el proyecto

Ver [`docs/MIGRATION.md`](docs/MIGRATION.md). No hay que rehacer las apps: se cambia el host de Postgres/Storage.

## Flujo

`precargada` → `graduada` → `pendiente` → `confirmada` → `entregada` (o `cancelada`)
