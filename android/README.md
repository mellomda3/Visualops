# Visualops Android (nativo)

App de terreno: Kotlin + Jetpack Compose. Habla con la **misma API** que la web (Supabase hoy; Postgres+S3 mañana).

## Requisitos (ya instalados en esta máquina)

- JDK 17 (`C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot`)
- Android SDK (`%LOCALAPPDATA%\Android\Sdk`) — platform 35, build-tools, platform-tools
- Android Studio (opcional, para UI/emulador gráfico)
- Gradle Wrapper en `android/`

## Configurar

`android/local.properties` (no se commitea):

```properties
sdk.dir=C:\\Users\\TU_USER\\AppData\\Local\\Android\\Sdk
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

## Generar APK (debug)

```powershell
cd android
.\gradlew.bat assembleDebug
```

APK:
`android\app\build\outputs\apk\debug\app-debug.apk`

## Probar

**Emulador / dispositivo**

```powershell
# con emulador o USB + depuración
adb install -r app\build\outputs\apk\debug\app-debug.apk
adb shell am start -n net.visualops.app/.MainActivity
```

**Android Studio:** Open → carpeta `android/` → Run.

## Login

Mismos usuarios que la web, p. ej.:

- `admin@visualops.local` / `demo1234`
- `recepcion@visualops.local` / `demo1234`

## Offline

Si no hay red al guardar una precarga, el alta entra en `sync_queue` (Room) y WorkManager la sube al volver internet.
