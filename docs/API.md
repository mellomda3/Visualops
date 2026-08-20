# Contrato API (web + Android)

Misma forma en Supabase hoy y en un Postgres+PostgREST mañana.

| Recurso | Método | Notas |
|---|---|---|
| `/auth/v1/token` | POST | login email/password |
| `/rest/v1/campaigns` | GET/POST | campañas de la org |
| `/rest/v1/records` | GET/POST/PATCH/DELETE | fichas |
| `/rest/v1/rpc/next_ficha_nro` | POST | correlativo en servidor |
| `/rest/v1/refractions` | POST/PATCH | receta |
| `/rest/v1/orders` | POST/PATCH | pedido |
| `/rest/v1/files` | GET/POST/DELETE | metadatos |
| `/storage/v1/object/archivos/{path}` | PUT | binario (S3-compatible) |

Headers: `Authorization: Bearer <jwt>`, `apikey` si el host lo pide.

Estados de ficha: `precargada` → `graduada` → `pendiente` → `confirmada` → `entregada` | `cancelada`.
