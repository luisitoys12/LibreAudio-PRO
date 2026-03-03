# LibreAudio PRO - Aplicación Android

## 📱 Construcción de la App Android

Esta carpeta contiene la configuración de Capacitor para generar la aplicación Android nativa.

## 🚀 Compilación Local

### Requisitos previos

- Node.js 18+
- JDK 17
- Android Studio
- Android SDK (API 33+)

### Pasos de instalación
```bash
# 1. Instalar dependencias
cd android-app
npm install

# 2. Copiar assets de la PWA
npm run build

# 3. Inicializar proyecto Android (solo primera vez)
npx cap add android

# 4. Sincronizar código web con Android
npx cap sync android

# 5. Abrir en Android Studio
npx cap open android
```

### Compilar APK desde terminal

```bash
# APK Debug
cd android
./gradlew assembleDebug

# APK Release (requiere configurar keystore)
./gradlew assembleRelease
```

El APK se generará en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## ⚙️ Configuración

### Cambiar ID de aplicación

Edita `capacitor.config.json`:
```json
{
  "appId": "com.tudominio.libreaudio"
}
```

### Cambiar nombre de la app

Edita `capacitor.config.json`:
```json
{
  "appName": "Tu Nombre App"
}
```

### Personalizar ícono y splash screen

1. Coloca tus imágenes en `android/app/src/main/res/`
2. Usa [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/)

## 🔒 Firma de APK (Release)

### 1. Generar keystore

```bash
keytool -genkey -v -keystore libreaudio-release.keystore \
  -alias libreaudio -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configurar en `capacitor.config.json`

```json
{
  "android": {
    "buildOptions": {
      "keystorePath": "../libreaudio-release.keystore",
      "keystoreAlias": "libreaudio"
    }
  }
}
```

### 3. Compilar release

```bash
cd android
./gradlew assembleRelease
```

## 🤖 Compilación Automática con GitHub Actions

El workflow `.github/workflows/android-build.yml` compila automáticamente:

- **En cada push a main**: Genera APK debug y lo sube como artifact
- **En tags (v*)**: Crea un release con el APK adjunto

### Crear un release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions compilará el APK y lo publicará en Releases automáticamente.

## 📦 Distribuciones

### Google Play Store

1. Compila un APK/AAB firmado (release)
2. Crea una cuenta de desarrollador en [Google Play Console](https://play.google.com/console)
3. Sube tu APK/AAB
4. Completa la información de la app
5. Envía para revisión

### Distribución directa

- Sube el APK a GitHub Releases
- Comparte el enlace de descarga
- Los usuarios deben habilitar "Instalar apps de orígenes desconocidos"

## 🔧 Plugins Capacitor Disponibles

Actualmente incluye:

- **@capacitor/app**: Info de la app, eventos del ciclo de vida
- **@capacitor/splash-screen**: Pantalla de splash personalizada
- **@capacitor/status-bar**: Control de la barra de estado

### Agregar más plugins

```bash
npm install @capacitor/camera
npx cap sync
```

Plugins útiles:
- `@capacitor/share`: Compartir contenido
- `@capacitor/filesystem`: Acceso a archivos
- `@capacitor/network`: Estado de la red
- `@capacitor/browser`: Abrir navegador

## 🐛 Troubleshooting

### Error: SDK no encontrado

```bash
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools
```

### Error: JDK no compatible

Asegúrate de usar JDK 17:
```bash
java -version
# Debe mostrar version 17.x.x
```

### Sincronizar cambios de la PWA

```bash
npm run build
npx cap sync
```

## 📊 Versionado

Para actualizar la versión:

1. Edita `package.json` (version)
2. Edita `android/app/build.gradle`:
   ```gradle
   versionCode 2
   versionName "1.0.1"
   ```
3. Commit y crea un nuevo tag

## 📄 Licencia

MIT - Ver [LICENSE](../LICENSE)
