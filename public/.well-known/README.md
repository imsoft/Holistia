# Universal Links / App Links (app móvil Holistia)

Estos ficheros permiten que los enlaces de la web (ej. `https://tudominio.com/explore/event/123`) abran la app móvil cuando esté instalada.

## 1. apple-app-site-association (iOS)

- **Ubicación**: debe servirse en `https://tudominio.com/.well-known/apple-app-site-association` (sin extensión).
- **Reemplazar**: `TEAMID` por tu Apple Team ID (10 caracteres, en Apple Developer). `com.holistia.app` debe coincidir con el `bundleIdentifier` de la app en EAS/Expo.
- **Servidor**: el fichero debe servirse con `Content-Type: application/json` (o dejar que el servidor use el tipo por defecto). Sin caché agresiva para que Apple pueda verificarlo.

## 2. assetlinks.json (Android)

- **Ubicación**: `https://tudominio.com/.well-known/assetlinks.json`.
- **Reemplazar**:
  - `package_name`: debe ser el mismo que `android.package` en tu build de Expo/EAS (ej. `com.holistia.app`).
  - `sha256_cert_fingerprints`: SHA256 del certificado de firma (release). Obtener con:
    ```bash
    keytool -list -v -keystore tu-keystore.keystore -alias tu-alias
    ```
    O en Google Play Console → Tu app → Configuración → Integridad de la app → Certificado de firma de la app.
- Documentación: [Verify Android App Links](https://developer.android.com/training/app-links/verify-android-applinks).

## 3. App móvil (Expo)

En `app/holistia/app.config.js` (o `app.json`) debe estar configurado:

- **iOS**: `ios.associatedDomains`: `["applinks:tudominio.com"]` (sustituir por tu dominio).
- **Android**: con EAS Build, los App Links se pueden configurar; el dominio debe coincidir con el que sirve `assetlinks.json`.

Tras publicar los ficheros en tu dominio y hacer un nuevo build nativo, los enlaces web deberían abrir la app cuando esté instalada.
