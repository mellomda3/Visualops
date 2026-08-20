# Visualops

Sistema de campañas ópticas itinerantes: recepción → graduación → óptico → panel de gestión.

## Stack

- Vite + React + TypeScript + Tailwind CSS
- Supabase (Auth, Postgres, Storage, RLS) en producción
- Modo demo local (sin Supabase) con `localStorage`

## Desarrollo

```bash
npm install
npm run dev
```

Sin variables de entorno, arranca en **modo demo**.

### Cuentas demo

| Email | Rol | Password |
|---|---|---|
| admin@visualops.local | admin | demo1234 |
| recepcion@visualops.local | recepcion | demo1234 |
| graduacion@visualops.local | graduador | demo1234 |
| optico@visualops.local | optico | demo1234 |

## Supabase

1. Copiá `.env.example` a `.env`
2. Completá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
3. Ejecutá `supabase/migrations/001_initial.sql` en el SQL Editor
4. Creá usuarios en Auth (o invitá) con `raw_user_meta_data.role` = `admin` | `recepcion` | `graduador` | `optico`

## Deploy (Netlify)

```bash
npm run build
```

Publicá la carpeta `dist`. El archivo `netlify.toml` ya incluye redirect SPA.

Usá el dominio `tu-sitio.netlify.app` **sin** `www`.

## Flujo de estados

`precargada` → `graduada` → `pendiente` → `confirmada` → `entregada` (o `cancelada`)
