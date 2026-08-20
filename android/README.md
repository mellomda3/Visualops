# Visualops Android (nativo)

App de terreno: Kotlin + Jetpack Compose. Habla con la **misma API** que la web (Supabase hoy; Postgres+S3 mañana).

## Requisitos

- Android Studio Ladybug+
- JDK 17
- Proyecto Supabase con migraciones `001` y `002`

## Configurar

En [AppConfig.kt](app/src/main/java/net/visualops/app/AppConfig.kt):

```kotlin
const val supabaseUrl = "https://xxxx.supabase.co"
const val supabaseAnonKey = "eyJ..."
```

Los mismos valores que `VITE_SUPABASE_*` de la web.

## Abrir y generar APK

1. Android Studio → Open → carpeta `android/`
2. Sync Gradle
3. Run en un teléfono o `Build → Build APK`

## Offline

Si no hay red al guardar una precarga, el alta entra en `sync_queue` (Room) y WorkManager la sube al volver internet.

## Archivos

Óptico → “Adjuntar receta” usa el selector nativo (cámara/galería) y sube a Storage. En la BD solo queda `path` + `kind`.
