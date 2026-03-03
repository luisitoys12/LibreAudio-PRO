# LibreAudio PRO - PWA Edition

## 🎵 Progressive Web App para GitHub Pages

Esta es la versión PWA (Progressive Web App) de LibreAudio PRO, diseñada para funcionar completamente en el frontend sin necesidad de un backend PHP.

## ✨ Características

- **📱 PWA**: Instalable en dispositivos móviles y de escritorio
- **⚡ Offline**: Funciona sin conexión gracias al Service Worker
- **💾 Local Storage**: Los datos se almacenan localmente en el dispositivo
- **🔍 Búsqueda**: Filtra contenido por nombre, categoría o tipo
- **📥📤 Importar/Exportar**: Guarda y carga datos en formato JSON
- **🎨 Responsive**: Diseño adaptado para todos los tamaños de pantalla
- **🌙 Dark Mode**: Tema oscuro optimizado para la vista

## 🚀 Instalación en GitHub Pages

### 1. Configurar GitHub Pages

1. Ve a **Settings** → **Pages** en tu repositorio
2. En **Source**, selecciona:
   - Branch: `main` (o tu rama principal)
   - Folder: `/docs`
3. Guarda los cambios

### 2. Agregar íconos

Crea los siguientes íconos en `docs/icons/`:

- `icon-72.png` (72x72px)
- `icon-96.png` (96x96px)
- `icon-128.png` (128x128px)
- `icon-144.png` (144x144px)
- `icon-152.png` (152x152px)
- `icon-192.png` (192x192px)
- `icon-384.png` (384x384px)
- `icon-512.png` (512x512px)

Puedes usar herramientas como [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator) para generar todos los tamaños.

### 3. Acceder a tu PWA

Tu aplicación estará disponible en:
```
https://[tu-usuario].github.io/LibreAudio-PRO/
```

## 📱 Instalar como App

### En Android/Chrome:
1. Abre la PWA en Chrome
2. Toca el menú (⋮) → "Añadir a pantalla de inicio"
3. La app se instalará como una aplicación nativa

### En iOS/Safari:
1. Abre la PWA en Safari
2. Toca el botón de compartir (⬆)
3. Selecciona "Añadir a pantalla de inicio"

### En Desktop:
1. Abre la PWA en Chrome/Edge
2. Busca el ícono de instalación (+) en la barra de direcciones
3. Haz clic en "Instalar"

## 🛠️ Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/luisitoys12/LibreAudio-PRO.git
cd LibreAudio-PRO/docs

# Servir con un servidor HTTP simple
python3 -m http.server 8080
# o
npx serve .

# Abrir en el navegador
open http://localhost:8080
```

## 📊 Estructura de Datos

Los datos se almacenan en `localStorage` con la siguiente estructura:

```json
[
  {
    "id": "item-1234567890",
    "name": "Nombre de la radio/podcast",
    "type": "radio|podcast|musica|audiolibro",
    "category": "Categoría o género",
    "description": "Descripción del contenido",
    "url": "https://ejemplo.com/stream",
    "createdAt": 1234567890000
  }
]
```

## 🔧 Personalización

### Cambiar colores

Edita las variables CSS en `styles/main.css`:

```css
:root {
  --color-accent: #22c55e; /* Color principal */
  --color-bg-primary: #020617; /* Fondo principal */
  /* ... más variables */
}
```

### Modificar datos de ejemplo

Edita el array `defaultData` en `scripts/app.js`:

```javascript
const defaultData = [
  {
    id: 'demo-1',
    name: 'Tu Radio',
    // ...
  }
];
```

## 🔒 Privacidad

- **Sin seguimiento**: No se recopilan datos de usuario
- **Almacenamiento local**: Los datos solo se guardan en tu dispositivo
- **Sin analytics**: No hay herramientas de análisis integradas
- **Enlaces externos**: Los enlaces se abren con `noopener,noreferrer`

## 🐛 Solución de Problemas

### La PWA no se actualiza
1. Limpia la caché del navegador
2. Desinstala y reinstala la PWA
3. Actualiza el número de versión en `sw.js` (CACHE_NAME)

### Los datos desaparecen
- Los datos en `localStorage` pueden eliminarse si el usuario limpia la caché
- Usa la función de exportación para hacer respaldos regulares

### Service Worker no funciona
- Los Service Workers requieren HTTPS (GitHub Pages lo proporciona)
- En desarrollo local, usa `localhost` (permitido sin HTTPS)

## 🚧 Próximas Características

- [ ] Sincronización con backend opcional
- [ ] Compartir contenido
- [ ] Categorías personalizadas
- [ ] Reproductor integrado
- [ ] Favoritos
- [ ] Historial de reproducción

## 📄 Licencia

MIT License - Ver [LICENSE](../LICENSE) para más detalles

## 🤝 Contribuir

¿Encontraste un bug o tienes una sugerencia? Abre un [issue](https://github.com/luisitoys12/LibreAudio-PRO/issues) o envía un pull request.

---

**LibreAudio PRO** - Democratizando el acceso al audio libre 🎧
