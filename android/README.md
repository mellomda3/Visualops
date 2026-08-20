# Visualops Android (nativo)

App de terreno: Kotlin + Jetpack Compose. Habla con la **misma API** que la web (Supabase hoy; Postgres+S3 mañana).

## Requisitos

- Android Studio Ladybug+
- JDK 17
- Proyecto Supabase con migraciones `001` y `002`

## Configurar

1. Copiá `local.properties.example` → `local.properties` (o dejá que Android Studio cree el `sdk.dir`).
2. Agregá las mismas keys que la web:

```properties
sdk.dir=C:\\Users\\TU_USER\\AppData\\Local\\Android\\Sdk
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

Gradle las inyecta en `BuildConfig` (no van hardcodeadas en el código fuente).

## Abrir y generar APK

1. Android Studio → Open → carpeta `android/`
2. Sync Gradle
3. Run en un teléfono o **Build → Build Bundle(s) / APK(s) → Build APK(s)**

Login demo: `admin@visualops.local` / `demo1234`

## Offline

Si no hay red al guardar una precarga, el alta entra en `sync_queue` (Room) y WorkManager la sube al volver internet.

## Archivos

Óptico → “Adjuntar” usa galería/cámara y sube a Storage. En la BD queda `path` + `kind`.
